
from django.conf import settings
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
import tempfile
import os

# Import parsing logic
from dars_parser.extract_dars_text import extract_text_pdfminer
from dars_parser.get_taken_courses import extract_taken_courses
from dars_parser.get_needed_courses_from_audit import extract_requirements

from api.models import UserProfile

@api_view(['POST'])
@parser_classes([MultiPartParser])
def upload_audit(request):
    """
    Creates a new user profile.
    If a DARS audit file is provided, it parses requirements and taken courses.
    Also accepts profile information (name, major, etc).
    """
    
    # 1. Parse File if present
    taken_list = []
    requirements = []
    
    if 'file' in request.FILES:
        uploaded_file = request.FILES['file']
        
        # Create a temporary file to save the uploaded content
        suffix = '.pdf' if uploaded_file.name.lower().endswith('.pdf') else '.txt'
        
        # Check explicit cleanup needs; delete=False requires manual removal
        tmp_path = None
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
                for chunk in uploaded_file.chunks():
                    tmp.write(chunk)
                tmp_path = tmp.name

            # Extract text based on file type
            if suffix == '.pdf':
                text = extract_text_pdfminer(tmp_path)
            else:
                with open(tmp_path, 'r', encoding='utf-8', errors='ignore') as f:
                    text = f.read()

            # Extract taken courses
            taken_courses_data = extract_taken_courses(text)
            taken_courses_set = {c for q, c in taken_courses_data}
            
            # Extract requirements
            requirements = extract_requirements(text, taken_courses=taken_courses_set)
            
            # Format the taken courses
            taken_list = [{'quarter': q, 'course': c} for q, c in taken_courses_data]
            
        except Exception as e:
            # If parsing fails, we still might want to proceed creating the user 
            # but maybe without course data? Or fail hard? 
            # For now let's return error to let user know parsing failed.
            if tmp_path and os.path.exists(tmp_path):
                os.remove(tmp_path)
            return Response({'error': f"Failed to parse file: {str(e)}"}, status=500)
            
        finally:
            if tmp_path and os.path.exists(tmp_path):
                os.remove(tmp_path)

    # 2. Extract Profile Data
    data = request.data
    first_name = data.get('firstName', '')
    last_name = data.get('lastName', '')
    full_name = f"{first_name} {last_name}".strip()
    
    major = data.get('major')
    minor = data.get('minor')
    grad_year = data.get('graduationYear')
    grad_quarter = data.get('graduationQuarter')
    
    # Convert year to int if possible
    try:
        year_int = int(grad_year) if grad_year else None
    except ValueError:
        year_int = None

    # 3. Create User Profile
    try:
        profile = UserProfile.objects.create(
            name=full_name,
            major=major,
            minor=minor,
            year=year_int,
            expected_grad=grad_quarter,
            classes_taken=taken_list,
            classes_needed=requirements
        )

        return Response({
            'user_id': profile.id,
            'profile': {
                 'name': profile.name,
                 'major': profile.major,
                 'minor': profile.minor,
                 'year': profile.year,
                 'expected_grad': profile.expected_grad
            },
            'taken_courses': taken_list,
            'requirements': requirements
        })
    except Exception as e:
        return Response({'error': f"Database error: {str(e)}"}, status=500)
