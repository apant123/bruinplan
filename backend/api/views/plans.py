from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from api.models import Plan



def _debug_auth(request):
    print("=== AUTH DEBUG ===")
    print("Authorization header:", request.headers.get("Authorization"))
    print("X-User-Id header:", request.headers.get("X-User-Id"))
    print("request.user:", request.user)
    print("is_authenticated:", getattr(request.user, "is_authenticated", None))
    print("request.user.id:", getattr(request.user, "id", None))
    print("==================")


def _get_user_id(request):
    """
    Prefer real auth. Fall back to X-User-Id for local testing.
    """
    user_id = getattr(request.user, "id", None)
    if user_id:
        return user_id

    # DEV ONLY: allow manual injection
    x_user_id = request.headers.get("X-User-Id")
    return x_user_id


@api_view(["GET", "POST"])
def plans_view(request):
    _debug_auth(request)

    user_id = _get_user_id(request)
    if not user_id:
        return Response(
            {"error": "unauthenticated: no request.user.id and no X-User-Id header"},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if request.method == "GET":
        qs = Plan.objects.filter(user_id=user_id).order_by("-updated_at", "-created_at")
        data = [
            {
                "id": p.id,
                "user_id": str(p.user_id),
                "name": p.name,
                "start_year": p.start_year,
                "created_at": p.created_at,
                "updated_at": p.updated_at,
            }
            for p in qs
        ]
        return Response({"plans": data})

    # POST
    name = request.data.get("name")
    start_year = request.data.get("start_year", None)

    if not name or not isinstance(name, str) or not name.strip():
        return Response({"error": "name is required"}, status=status.HTTP_400_BAD_REQUEST)

    # IMPORTANT: if your DB has defaults for created_at/updated_at, do NOT pass them.
    p = Plan.objects.create(
        user_id=user_id,
        name=name.strip(),
        start_year=start_year,
    )

    return Response(
        {
            "id": p.id,
            "user_id": str(p.user_id),
            "name": p.name,
            "start_year": p.start_year,
            "created_at": p.created_at,
            "updated_at": p.updated_at,
        },
        status=status.HTTP_201_CREATED,
    )