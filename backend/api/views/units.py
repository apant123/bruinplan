from rest_framework.decorators import api_view
from rest_framework.response import Response
from api.models.users import UserProfile

@api_view(["GET"])
def total_units(request):
    user_id = request.headers.get("X-User-Id")
    if not user_id:
        return Response({"error": "Missing X-User-Id header"}, status=400)

    try:
        profile = UserProfile.objects.get(id=user_id)
    except UserProfile.DoesNotExist:
        return Response({"error": "User profile not found"}, status=404)

    return Response({"total_units": profile.total_units})

@api_view(["GET"])
def ge_units(request):
    user_id = request.headers.get("X-User-Id")
    if not user_id:
        return Response({"error": "Missing X-User-Id header"}, status=400)

    try:
        profile = UserProfile.objects.get(id=user_id)
    except UserProfile.DoesNotExist:
        return Response({"error": "User profile not found"}, status=404)

    return Response({"total_units": profile.ge_units})

@api_view(["GET"])
def major_units(request):
    user_id = request.headers.get("X-User-Id")
    if not user_id:
        return Response({"error": "Missing X-User-Id header"}, status=400)

    try:
        profile = UserProfile.objects.get(id=user_id)
    except UserProfile.DoesNotExist:
        return Response({"error": "User profile not found"}, status=404)

    return Response({"total_units": profile.major_units})

@api_view(["GET"])
def upper_units(request):
    user_id = request.headers.get("X-User-Id")
    if not user_id:
        return Response({"error": "Missing X-User-Id header"}, status=400)

    try:
        profile = UserProfile.objects.get(id=user_id)
    except UserProfile.DoesNotExist:
        return Response({"error": "User profile not found"}, status=404)

    return Response({"total_units": profile.upper_units})