-- CreateIndex
CREATE INDEX "EventChecklistItem_sub_event_id_idx" ON "EventChecklistItem"("sub_event_id");

-- CreateIndex
CREATE INDEX "EventRequest_sub_event_id_idx" ON "EventRequest"("sub_event_id");

-- CreateIndex
CREATE INDEX "GuestAttendee_invite_id_idx" ON "GuestAttendee"("invite_id");

-- CreateIndex
CREATE INDEX "GuestHousehold_event_id_idx" ON "GuestHousehold"("event_id");

-- CreateIndex
CREATE INDEX "GuestSubEventInvite_household_id_idx" ON "GuestSubEventInvite"("household_id");

-- CreateIndex
CREATE INDEX "GuestSubEventInvite_sub_event_id_idx" ON "GuestSubEventInvite"("sub_event_id");

-- CreateIndex
CREATE INDEX "SubEvent_event_id_idx" ON "SubEvent"("event_id");
