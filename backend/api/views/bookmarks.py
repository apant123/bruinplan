from rest_framework.decorators import api_view
from rest_framework.response import Response
from api.models.users import UserProfile

@api_view(["GET", "POST", "DELETE"])
def manage_bookmarks(request, course_id=None):
    user_id = request.headers.get("X-User-Id")
    if not user_id:
        return Response({"error": "Missing X-User-Id header"}, status=400)
        
    try:
        profile = UserProfile.objects.get(id=user_id)
    except UserProfile.DoesNotExist:
        return Response({"error": "User profile not found"}, status=404)
        
    # Bookmarks should be a list of integers
    bookmarks = profile.bookmarked or []
    if not isinstance(bookmarks, list):
        bookmarks = []
    
    if request.method == "GET":
        return Response({"bookmarks": bookmarks})
        
    if not course_id:
        return Response({"error": "Missing course_id"}, status=400)
        
    try:
        course_id = int(course_id)
    except ValueError:
        return Response({"error": "Invalid course_id"}, status=400)
    
    if request.method == "POST":
        if course_id not in bookmarks:
            bookmarks.append(course_id)
            profile.bookmarked = bookmarks
            profile.save(update_fields=["bookmarked"])
        return Response({"bookmarks": profile.bookmarked})
        
    elif request.method == "DELETE":
        if course_id in bookmarks:
            bookmarks.remove(course_id)
            profile.bookmarked = bookmarks
            profile.save(update_fields=["bookmarked"])
        return Response({"bookmarks": profile.bookmarked})
