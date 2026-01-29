from django.urls import path
from api.views.plans import plans_view, plan_items_view, plan_item_detail_view

urlpatterns = [
    path("", plans_view),
    path("<int:plan_id>/items/", plan_items_view),
    path("<int:plan_id>/items/<int:item_id>", plan_item_detail_view)
]