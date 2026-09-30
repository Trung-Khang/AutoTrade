package com.system.dto;

public class CheckInRequest {

    private boolean testDriveCompleted = false;
    private String staffNote;

    public CheckInRequest() {
    }

    public boolean isTestDriveCompleted() {
        return testDriveCompleted;
    }

    public void setTestDriveCompleted(boolean testDriveCompleted) {
        this.testDriveCompleted = testDriveCompleted;
    }

    public String getStaffNote() {
        return staffNote;
    }

    public void setStaffNote(String staffNote) {
        this.staffNote = staffNote;
    }
}
