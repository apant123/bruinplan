from rest_framework.decorators import api_view
from rest_framework.response import Response
from api.models.users import UserProfile
from dotenv import load_dotenv
from django.db import IntegrityError
import jwt
import os


@api_view(["POST"])
def createUser(request):


    record = request.data.get("record")

    if not record.get("id") or not record.get("created_at"):
        return Response({
            "error": "webhook payload missing id or crated_at field"
        }, status = 400)

    newUser = UserProfile(
        uuid = record.get("id"),
        created_at = record.get("created_at")
    )

    try:
        newUser.save()
    except IntegrityError:
        return Response({
            "uid": newUser.uuid,
            "message": "User with uuid already exists"
        }, status = 400)
    
    return Response({
        "uuid": newUser.uuid,
        "created_at": newUser.created_at
    }, status = 201)


@api_view(["GET"])
def getProfile(request):

    load_dotenv()
    jwt_secret = os.getenv("SUPABASE_JWT_SECRET")
    auth_header = request.headers.get("Authorization")

    if not auth_header:
        return Response({"No Authorization Provided"}, status = 401)
    
    try:
        jwt_val = auth_header.split(" ", 1)[1]

        #HS256 is what supabase supports as JWT algo
        payload = jwt.decode(jwt_val, jwt_secret, algorithms=["HS256"], audience="authenticated")
    except:
        return Response({
            "error": "invalid jwt or invalid jwt format",
            }, status = 401)
    
    user_uuid = payload["sub"]

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


