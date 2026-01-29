from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
import uuid
from django.db import IntegrityError


from api.models import Plan, UserProfile, PlanItem

def _debug_auth(request):
    print("=== AUTH DEBUG ===")
    print("Authorization header:", request.headers.get("Authorization"))
    print("X-User-Id header:", request.headers.get("X-User-Id"))
    print("request.user:", request.user)
    print("is_authenticated:", getattr(request.user, "is_authenticated", None))
    print("request.user.id:", getattr(request.user, "id", None))
    print("==================")

def _get_user_uuid(request):
    user = getattr(request, "user", None)
    if user and getattr(user, "is_authenticated", False):
        return getattr(user, "id", None)

    x = request.headers.get("X-User-Id")
    if not x:
        return None
    try:
        return uuid.UUID(x)
    except ValueError:
        return "invalid"

def _resolve_plan_user_id(request):
    user_uuid = _get_user_uuid(request)
    if user_uuid is None:
        return None, Response({"error": "unauthenticated: ..."}, status=401)
    if user_uuid == "invalid":
        return None, Response({"error": "X-User-Id must be a UUID"}, status=400)

    # optional validation
    if not UserProfile.objects.filter(id=user_uuid).exists():
        return None, Response({"error": f"unknown user_profile id {user_uuid}"}, status=401)

    return user_uuid, None

@api_view(["GET", "POST"])
def plans_view(request):
    _debug_auth(request)

    plan_user_id, err = _resolve_plan_user_id(request)
    if err:
        return err

    if request.method == "GET":
        qs = Plan.objects.filter(user_id=plan_user_id).order_by("-updated_at", "-created_at")
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

    name = request.data.get("name")
    start_year = request.data.get("start_year", None)

    if not name or not isinstance(name, str) or not name.strip():
        return Response({"error": "name is required"}, status=status.HTTP_400_BAD_REQUEST)

    p = Plan.objects.create(
        user_id=plan_user_id,
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


@api_view(["GET", "POST"])
def plan_items_view(request, plan_id: int):
    _debug_auth(request)

    plan_user_id, err = _resolve_plan_user_id(request)
    if err:
        return err

    plan = Plan.objects.filter(id=plan_id, user_id=plan_user_id).first()
    if not plan:
        return Response({"error": "plan not found (or not yours)"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        qs = PlanItem.objects.filter(plan_id=plan.id).order_by("year_index", "term", "position", "id")
        data = [
            {
                "id": it.id,
                "plan_id": it.plan_id,
                "year_index": it.year_index,
                "term": it.term,
                "course_id": it.course_id,
                "status": it.status,
                "position": it.position,
                "notes": it.notes,
                "created_at": it.created_at,
            }
            for it in qs
        ]
        return Response({"items": data})

    if request.method == "POST":     
        # POST create
        year_index = request.data.get("year_index")
        term = request.data.get("term")
        course_id = request.data.get("course_id")

        if not isinstance(year_index, int) or year_index < 0:
            return Response({"error": "year_index must be a non-negative integer"}, status=status.HTTP_400_BAD_REQUEST)

        if term not in dict(PlanItem.Term.choices):
            return Response(
                {"error": f"term must be one of {list(dict(PlanItem.Term.choices).keys())}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not isinstance(course_id, int) or course_id <= 0:
            return Response({"error": "course_id must be a positive integer"}, status=status.HTTP_400_BAD_REQUEST)

        status_value = request.data.get("status", PlanItem.Status.PLANNED)
        if status_value not in dict(PlanItem.Status.choices):
            return Response(
                {"error": f"status must be one of {list(dict(PlanItem.Status.choices).keys())}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        position = request.data.get("position", 0)
        if not isinstance(position, int):
            return Response({"error": "position must be an integer"}, status=status.HTTP_400_BAD_REQUEST)

        notes = request.data.get("notes", None)
        if notes is not None and not isinstance(notes, str):
            return Response({"error": "notes must be a string or null"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            it = PlanItem.objects.create(
                plan_id=plan.id,         # important: use plan.id, not user_id
                year_index=year_index,
                term=term,
                course_id=course_id,
                status=status_value,
                position=position,
                notes=notes,
                # created_at: relies on DB default; if your DB doesn't default it, you'll need to set it explicitly
            )
        except IntegrityError as ex:
            # likely your uniq_plan_year_term_course in DB (or another constraint)
            return Response(
                {"error": "could not create plan item", "detail": str(ex)},
                status=status.HTTP_409_CONFLICT,
            )

        return Response(
            {
                "id": it.id,
                "plan_id": it.plan_id,
                "year_index": it.year_index,
                "term": it.term,
                "course_id": it.course_id,
                "status": it.status,
                "position": it.position,
                "notes": it.notes,
                "created_at": it.created_at,
            },
            status=status.HTTP_201_CREATED,
        )
    

@api_view(["PUT", "PATCH", "DELETE"])
def plan_item_detail_view(request, plan_id: int, item_id: int):
    _debug_auth(request)

    plan_user_id, err = _resolve_plan_user_id(request)
    if err:
        return err

    plan = Plan.objects.filter(id=plan_id, user_id=plan_user_id).first()
    if not plan:
        return Response({"error": "plan not found (or not yours)"}, status=404)

    item = PlanItem.objects.filter(id=item_id, plan_id=plan.id).first()
    if not item:
        return Response({"error": "plan item not found"}, status=404)

    if request.method in ("PUT", "PATCH"):
        data = request.data

        if "year_index" in data:
            if not isinstance(data["year_index"], int) or data["year_index"] < 0:
                return Response({"error": "invalid year_index"}, status=400)
            item.year_index = data["year_index"]

        if "term" in data:
            if data["term"] not in dict(PlanItem.Term.choices):
                return Response({"error": "invalid term"}, status=400)
            item.term = data["term"]

        if "status" in data:
            if data["status"] not in dict(PlanItem.Status.choices):
                return Response({"error": "invalid status"}, status=400)
            item.status = data["status"]

        if "position" in data:
            if not isinstance(data["position"], int):
                return Response({"error": "invalid position"}, status=400)
            item.position = data["position"]

        if "notes" in data:
            if data["notes"] is not None and not isinstance(data["notes"], str):
                return Response({"error": "invalid notes"}, status=400)
            item.notes = data["notes"]

        try:
            item.save()
        except IntegrityError as ex:
            return Response(
                {"error": "update failed", "detail": str(ex)},
                status=409,
            )

        return Response(
            {
                "id": item.id,
                "plan_id": item.plan_id,
                "year_index": item.year_index,
                "term": item.term,
                "course_id": item.course_id,
                "status": item.status,
                "position": item.position,
                "notes": item.notes,
                "created_at": item.created_at,
            }
        )

    if request.method == "DELETE":
        item.delete()
        return Response(status=204)
