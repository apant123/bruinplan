from rest_framework.decorators import api_view
from rest_framework.response import Response
from api.models import Subject


@api_view(["GET"])
def list_subjects(request):
    if request.method == "GET":
        subjects = Subject.objects.all().order_by("id")
        data = []
        for subject in subjects:
            data.append({
                    "id": subject.id,
                    "code": subject.code,
                    "name": subject.name,
                    "created_at": subject.created_at,
                    "updated_at": subject.updated_at,})
        
        return Response({"subjects": data}) 
    
    
    
