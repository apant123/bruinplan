from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.exceptions import AuthenticationFailed
from api.models.users import UserProfile
from dotenv import load_dotenv
from django.db import IntegrityError
from supabase import create_client, Client, AuthApiError
import jwt
import os
import pathlib

#loading in .env file
ROOT_DIR = pathlib.Path(__file__).resolve().parents[3]  # goes up to project root
load_dotenv(ROOT_DIR / ".env")


def verifyUser(request):
    '''
    the jwt verification function to be called in secure routes
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
    

@api_view(["POST"])
def createUser(request):
    #create user in supabase auth users table, then create corrosponding user in userprofile table with matching uid and created_at field
    
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
                "password": password
                
            }
        )
    except AuthApiError:
        return Response({"error": "user with this email already exists"}, status = 400)
    
    if response is None or response.user is None:
        return Response({"error": "unexpected or no response from Supabase"}, status = 400)

    id = response.user.id
    creation_date = response.user.created_at
    newUser = UserProfile(
        uuid = id,
        created_at = creation_date
    )

    try:
        newUser.save()
    except IntegrityError:
        return Response({
            "uuid": newUser.uuid,
            "message": "User with uuid already exists"
        }, status = 400)
    
    return Response({
        "uuid": newUser.uuid,
        "created_at": newUser.created_at
    }, status = 201)



@api_view(["GET"])
def getProfile(request):
    #validate JWT from supabase auth, then return values for uid in userprofile table

    user_uuid = verifyUser(request)

    try:
        profile = UserProfile.objects.get(uuid=user_uuid)
    except UserProfile.DoesNotExist:
        return Response({"no profile found"}, status = 404)
    
    return Response({
        "uuid": profile.uuid,
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

    user_uuid = verifyUser(request)

    try:
        profile = UserProfile.objects.get(uuid=user_uuid)
    except UserProfile.DoesNotExist:
        return Response({"error": "no profile found"}, status = 404)
    
    UPDATEABLE_FIELDS = [
        "major",
        "minor",
        "expected_grad",
        "year",
        "completed_lower_div_units",
        "completed_upper_div_units",
        "gpa",
    ]

    updated_fields = []

    for field in UPDATEABLE_FIELDS:
        if field in request.data:
            setattr(profile, field, request.data.get(field) )
            updated_fields.append(field)

    if not updated_fields:
        return Response({"error": "No valid updateable fields provided"}, status=400)
    
    profile.save()

    return Response(
        {
            "message": "Profile updated successfully",
            "updated_fields": updated_fields
        },
        status=200
    )



