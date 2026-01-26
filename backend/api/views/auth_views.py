from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.exceptions import AuthenticationFailed, ValidationError
from api.models.users import UserProfile
from dotenv import load_dotenv
from django.db import IntegrityError
from supabase import create_client, Client, AuthApiError
import jwt
import os
import pathlib

#loading in .env file
#NOTE: this stuff + declaring constants from .env could go in settings and you wouldn't need to do this in every view that needs these, but for now it is here because no other views seem to need these details yet so maybe good to reduce scope with which they are present
ROOT_DIR = pathlib.Path(__file__).resolve().parents[3]  # goes up to project root
load_dotenv(ROOT_DIR / ".env")

def verifyUser(request):
    '''
    the jwt verification function to be called in secure routes; authentication performed by supabase
    '''

    JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")
    auth_header = request.headers.get("Authorization")

    if not auth_header:
        raise AuthenticationFailed("No authorization provided")
    
    try:
        jwt_val = auth_header.split(" ", 1)[1]

        #HS256 is what supabase supports as JWT algo
        payload = jwt.decode(jwt_val, JWT_SECRET, algorithms=["HS256"], audience="authenticated")
    except Exception:
        raise AuthenticationFailed("invalid authentication token or malformed format")
    
    return payload["sub"]
    


def apply_profile_updates(user_profile, data):
    '''
    given a user_profile to modify and the data to modify profile with, applies the modifications to user_profile. Returns the fields that were updated
    raises type error if invalid typing provided for column.
    raises validation error if no columns were updated
    will not update a field to be blank, and will instead ignore empty fields
    '''
    UPDATEABLE_FIELDS = {
        "name": str,
        "major": str,
        "minor": str,
        "expected_grad": str,
        "year": int,
        "completed_lower_div_units": int,
        "completed_upper_div_units": int,
        "gpa": float
    }

    updated_fields = []

    for field, expected_type in UPDATEABLE_FIELDS.items():
        if field in data:
            value = data[field]
            if value is not None and isinstance(value, expected_type):
                setattr(user_profile, field, data.get(field))
                updated_fields.append(field)
            elif value is not None:
                raise TypeError(f"Attempting to update column {field} with invalid type: Expected {expected_type}, but was provided {value}")

    if not updated_fields:
        raise ValidationError("No valid columns were provided to be pdate")

    return updated_fields




@api_view(["POST"])
def createUser(request):
    #create user in supabase auth users table, then create corrosponding user in userprofile table with matching uid and created_at field
    
    print("CREATE USER REQUEST DATA:", request.data)

    SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
    SUPABASE_URL = os.getenv("SUPABASE_URL")

    email = request.data.get("email")
    password = request.data.get("password")

    
    if email is None or password is None:
        return Response({"Need email and password to sign up"}, status = 400)
    
    #remove accidental trailing or leading whitespace for entries; just good hygeine
    email, password = email.strip(), password.strip()

    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    try:
        response = supabase.auth.admin.create_user(
            {
                "email": email,
                "password": password,
                "email_confirm": True 
             
            }
        )
    except Exception as e:
        return Response({"error": f"{e}"}, status = 400)

    if response is None or response.user is None:
        return Response({"error": "unexpected or no response from Supabase"}, status = 400)

    uuid = response.user.id
    creation_date = response.user.created_at
    newUser = UserProfile(
        id = uuid,
        created_at = creation_date
    )

    try:
        newUser.save()
    except IntegrityError:
        return Response({
            "id": newUser.id,
            "message": "User with id already exists"
        }, status = 400)
    
    #now we try to save the other optional details. This is in seperate try block because don't want malformed optional details to result in a corrosponding userProfile not being created for each supabase auth entry.
    #if this step fails it's okay, we can just leave these fields blank for now and let them be updated later
    try:

        apply_profile_updates(newUser, request.data)
        newUser.save()
    except Exception as e:
        print(f"Warning:  additional profile details could not be fully assigned: {e}")  

    #after signing up user immediately log them in

    login_res = supabase.auth.sign_in_with_password({
        "email": email,
        "password": password
    })

    if login_res.session is None:
        return Response({
            "id": newUser.id,
            "message": "User created but login failed"
        }, status=201)
    
    jwt_token = login_res.session.access_token

    return Response({
        "id": newUser.id,
        "created_at": newUser.created_at,
        "accessToken": jwt_token,
        "message": "User successfully created and logged in"
    }, status = 201)



@api_view(["GET"])
def getProfile(request):
    #validate JWT from supabase auth, then return values for uid in userprofile table

    user_id = verifyUser(request)

    try:
        profile = UserProfile.objects.get(id=user_id)
    except UserProfile.DoesNotExist:
        return Response({"no profile found"}, status = 404)
    
    return Response({
        "id": profile.id,
        "name": profile.name,
        "major": profile.major,
        "minor": profile.minor,
        "expected_grad": profile.expected_grad,
        "year": profile.year,
        "completed_lower_div_units": profile.completed_lower_div_units,
        "completed_upper_div_units": profile.completed_upper_div_units,
        "gpa": profile.gpa,
        "created_at": profile.created_at,
        "updated_at": profile.updated_at
    }, status = 200)



@api_view(["PATCH"])
def updateProfile(request):

    user_id = verifyUser(request)

    try:
        profile = UserProfile.objects.get(id=user_id)
    except UserProfile.DoesNotExist:
        return Response({"error": "no profile found"}, status = 404)
    

    try:
        updated_fields = apply_profile_updates(profile, request.data)
        profile.save()
        return Response(
        {
            "message": "Profile updated successfully",
            "updated_fields": updated_fields
        },
        status=200
    )
    except (TypeError, ValidationError) as e:
        return Response({"message": str(e)}, status = 400)

    except Exception as e:
        return Response({"message": "internal server error !!!!!!!!!!!"}, status = 500)



