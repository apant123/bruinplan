import re
from rest_framework.decorators import api_view
from rest_framework.response import Response
from api.models.course import Course
from api.models.subject import Subject
from api.models.gradeDistribution import GradeDistribution

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
    
@api_view(["GET"])
def courses_by_ids(request):
    ids_param = request.query_params.get("ids", "")
    try:
        ids = [int(x) for x in ids_param.split(",") if x.strip()]
    except ValueError:
        return Response({"error": "ids must be comma-separated integers"}, status=400)
    if not ids:
        return Response({"courses": []})

    courses = Course.objects.filter(id__in=ids).order_by("id")
    # Build subject code lookup
    subject_ids = set(c.subject_area_id for c in courses)
    subjects = {s.id: s.code for s in Subject.objects.filter(id__in=subject_ids)}

    data = []
    for c in courses:
        data.append({
            "id": c.id,
            "subject_area_id": c.subject_area_id,
            "subject_code": subjects.get(c.subject_area_id, ""),
            "number": c.number,
            "title": c.title,
            "description": c.description,
            "units": c.units,
            "requisites_text": c.requisites_text,
            "requisites_parsed": c.requisites_parsed,
        })
    return Response({"courses": data})


@api_view(["GET"])
def course_prereqs(request, course_id = None):
    if request.method == "GET":
        if not course_id:
            #error
            pass
        try:
            reqs = Course.objects.values_list("requisites_parsed", flat=True).get(id=course_id)
        except Course.DoesNotExist:
            reqs = None
        
        if reqs is None:
            reqs = {}

        return Response({
            "course_id": course_id,
            "requisites": reqs
        })

@api_view(["POST"])
def courses_by_labels(request):
    labels = request.data.get("labels", [])
    if not labels:
        return Response({"courses": []})
        
    subjects = {s.id: s.code for s in Subject.objects.all()}
    courses = Course.objects.all()
    
    course_by_label = {}
    for c in courses:
        code = subjects.get(c.subject_area_id, "")
        label = f"{code} {c.number}".strip().upper()
        label = re.sub(r'\s+', ' ', label)
        course_by_label[label] = {
            "id": c.id,
            "subject_area_id": c.subject_area_id,
            "subject_code": code,
            "number": c.number,
            "title": c.title,
            "description": c.description,
            "units": c.units,
            "requisites_text": c.requisites_text,
            "requisites_parsed": c.requisites_parsed,
        }
        
    matched = []
    for l in labels:
        if not l: continue
        l_norm = re.sub(r'\s+', ' ', str(l).strip().upper())
        if l_norm in course_by_label:
            matched.append(course_by_label[l_norm])
            
    return Response({"courses": matched})

@api_view(["GET"])
def course_grades(request, course_id=None):
    if not course_id:
        return Response({"error": "course_id is required"}, status=400)
    
    distributions = GradeDistribution.objects.filter(course_id=course_id)
    
    data = []
    for d in distributions:
        data.append({
            "term": d.term,
            "instructor": d.instructor,
            "grades_json": d.grades_json,
            "total_enrolled": d.total_enrolled
        })

    return Response({"grades": data})