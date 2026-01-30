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
import traceback


#loading in .env file
#NOTE: this stuff + declaring constants from .env could go in settings and you wouldn't need to do this in every view that needs these, but for now it is here because no other views seem to need these details yet so maybe good to reduce scope with which they are present


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
    try:
        print("CREATE USER REQUEST DATA:", request.data)

        # --- Env vars ---
        supabase_url = os.getenv("SUPABASE_URL")

        # Prefer official Supabase name; fall back to your legacy name
        service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_SERVICE_KEY")
        anon_key = os.getenv("SUPABASE_ANON_KEY")

        if not supabase_url or not service_role_key:
            return Response(
                {"error": "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY)"},
                status=500,
            )

        # --- Required fields ---
        email = request.data.get("email")
        password = request.data.get("password")

        if not email or not password:
            return Response({"error": "Need email and password to sign up"}, status=400)

        email, password = email.strip(), password.strip()

        # --- Admin client for creating users ---
        admin: Client = create_client(supabase_url, service_role_key)

        try:
            res = admin.auth.admin.create_user(
                {
                    "email": email,
                    "password": password,
                    "email_confirm": True,
                }
            )
        except Exception as e:
            print("Supabase create_user failed:", repr(e))
            return Response({"error": str(e)}, status=400)

        if not res or not getattr(res, "user", None):
            return Response({"error": "Unexpected/no response from Supabase"}, status=400)

        user_id = res.user.id

        # --- Create local profile row (let DB default created_at handle it) ---
        new_user = UserProfile(id=user_id)

        try:
            new_user.save()
        except IntegrityError:
            return Response(
                {"id": user_id, "message": "UserProfile with this id already exists"},
                status=400,
            )

        # --- Optional profile fields (sanitize "None"/"" first) ---
        cleaned = dict(request.data)
        for k, v in list(cleaned.items()):
            if isinstance(v, str) and v.strip().lower() in ("none", "null", ""):
                cleaned[k] = None

        try:
            apply_profile_updates(new_user, cleaned)
            new_user.save()
        except Exception as e:
            print(f"Warning: optional profile details not fully applied: {e}")

        # --- Login (use anon key; service role key is not meant for normal sign-in) ---
        access_token = None
        if anon_key:
            user_client: Client = create_client(supabase_url, anon_key)
            try:
                login_res = user_client.auth.sign_in_with_password({"email": email, "password": password})
                if login_res and getattr(login_res, "session", None):
                    access_token = login_res.session.access_token
            except Exception as e:
                print(f"Warning: login failed after signup: {e}")
        else:
            print("Warning: SUPABASE_ANON_KEY missing; skipping auto-login")

        payload = {
            "user": {
                "id": str(new_user.id),
                "email": new_user.email if hasattr(new_user, "email") else email,
                "first_name": getattr(new_user, "first_name", None),
                "last_name": getattr(new_user, "last_name", None),
                "major": getattr(new_user, "major", None),
                "minor": getattr(new_user, "minor", None),
                "graduation_year": getattr(new_user, "graduation_year", None),
                "graduation_quarter": getattr(new_user, "graduation_quarter", None),
                "units": getattr(new_user, "units", None),
                "gpa": getattr(new_user, "gpa", None),
                "dars_connected": getattr(new_user, "dars_connected", None),
                "created_at": new_user.created_at,
            },
            "message": "User successfully created",
        }
        if access_token:
            payload["accessToken"] = access_token
            payload["message"] = "User successfully created and logged in"
        else:
            payload["message"] = "User created but login failed (or anon key missing)"

        return Response(payload, status=201)

    except Exception as e:
        traceback.print_exc()
        return Response({"error": str(e)}, status=500)



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



