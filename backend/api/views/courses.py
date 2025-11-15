from rest_framework.decorators import api_view
from rest_framework.response import Response
from api.models import Course

@api_view(["GET"])
def list_courses(request, subject_area_id = None):
    if request.method == "GET":
        if not subject_area_id:
            courses = Course.objects.all().order_by("id")
        else:
            courses = Course.objects.filter(subject_area_id=subject_area_id).order_by("id")
        data = []
        for course in courses:
            data.append({
                "id": course.id,
                "subject_area_id": course.subject_area_id,
                "number": course.number,
                "title": course.title,
                "description": course.description,
                "units": course.units,
                "requisites_text": course.requisites_text,
                "created_at": course.created_at,
                "updated_at": course.updated_at,
                "requisites_parsed": course.requisites_parsed,})
        return Response({"courses": data})