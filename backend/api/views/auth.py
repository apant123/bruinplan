from rest_framework.decorators import api_view
from rest_framework.response import Response
from api.models.users import UserProfile
import jwt
from dotenv import load_dotenv
import os


@api_view(["POST"])
def createUser(request):

    newUser = UserProfile(
        uuid = request.data.get("user").get("id")
    )
    newUser.save()
    return Response({
        "uuid": newUser.uuid       
    }, status = 201)


@api_view(["GET"])
def loggedInUser(request):

    load_dotenv()
    jwt_secret = os.getenv("SUPABASE_JWT_SECRET")
    auth_header = request.headers.get("Authorization")

    if not auth_header:
        return Response({"No Authorization Provided"}, status = 401)
    
    try:
        jwt_val = auth_header.split(" ", 1)[1]

        #HS256 is what supabase supports as JWT algo
        payload = jwt.decode(jwt_val, jwt_secret, algorithms=["HS256"])
    except:
        return Response({"invalid jwt or invalid jwt format"}, status = 401)
    
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
        "completed_lower_div": profile.completed_lower_div,
        "completed_upper_div": profile.completed_upper_div,
        "gpa": profile.gpa,
        "created_at": profile.created_at,
        "updated_at": profile.updated_at
    }, status = 200)


