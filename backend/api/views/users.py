from rest_framework.decorators import api_view
from rest_framework.response import Response
from api.models import User

@api_view(["GET", "POST", "PUT", "DELETE"])
def users(request, uuid = None):
    if request.method == "GET":
        if not iuud:
            users = User.objects.all().order_by("uuid")
        else:
            users = User.objects.all().filter(uuid=uuid)
        data = []
        for user in users:
            data.append({
                "uuid": user.uuid,
                "email": user.email,
                "password_hash": user.password_hash,
                "created_at": user.created_at,
                "updated_at": user.updated_at,
                "auth_provider": user.auth_provider,})
        return Response({"users": data})
    elif request.method == "POST":
        new_user = User(
            email = request.data.get("email"),
            password_hash = request.data.get("password_hash"),
            auth_provider = request.data.get("auth_provider"),
        )
        
        new_user.save()
        return Response({
            "id": new_user.id,
            "email": new_user.email,
            "auth_provider": new_user.auth_provider
            })
            