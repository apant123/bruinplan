from django.urls import include, path

urlpatterns = [
    path("", include("api.urls.main")),   # main endpoints
    path("subjects/", include("api.urls.subjects")),  
    path("courses/", include("api.urls.courses")),
    path("auth/", include("api.urls.auth_routes"))
]
