from rest_framework.decorators import api_view
from rest_framework.response import Response
from api.models import CourseOfferings

@api_view(["GET"])
def list_courses(request, term = None):
    if request.method == "GET":
        if not term:
            courses = CourseOfferings.objects.all().order_by("term")
        else:
            courses = CourseOfferings.objects.filter(term=term).order_by("term")
        data = []
        for course in courses:
            data.append({
                "id": course.id,
                "course_id": course.course_id,
                "term": course.term,
                "section": course.section,
                "instructor": course.instructor,
                "meeting_times": course.meeting_times,
                "location": course.location,
                "created_at": course.created_at,
                "updated_at": course.updated_at
                })
        return Response({"courses": data})