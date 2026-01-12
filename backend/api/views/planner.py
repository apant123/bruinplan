from rest_framework.decorators import api_view
from rest_framework.response import Response
from api.models import UserClass, UserClassMeeting

@api_view(["GET", "POST", "PUT", "DELETE"])
def planner(request, user_id = None, quarter = None):
    if request.method == "GET":
        if quarter == None:
            classes = UserClass.objects.filter(user_id = user_id)
        else:
            classes = UserClass.objects.filter(user_id = user_id, quarter = quarter)
        data = []
        for course in classes:
            meetings = UserClassMeeting.objects.filter(user_class_id=course.id)

            meeting_list = []
            for mtg in meetings:
                meeting_list.append({
                    "day_of_week": mtg.day_of_week,
                    "start_time": str(mtg.start_time),
                    "end_time": str(mtg.end_time),
                    "location": mtg.location,
                })

            data.append({
                "id": str(course.id),
                "title": course.title,
                "section": course.section,
                "quarter": course.quarter,
                "instructor": course.instructor,
                "units": course.units,
                "color": course.color,
                "meetings": meeting_list
            })

        return Response({"classes": data})
            
            