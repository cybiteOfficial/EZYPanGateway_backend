import { status } from "../api/pan-application-flow/entities/pan-application-flow.entity";

export function statusWiseApplications(req, matchQuery) {
  if (req.route.path.includes("/get-pending-applications")) {
    matchQuery = {
      $and: [{ status: status.PENDING }, { isDeleted: false }],
    };
  }

  if (req.route.path.includes("/get-inprogress-applications")) {
    matchQuery = {
      $and: [{ status: status.IN_PROGRESS }, { isDeleted: false }],
    };
    if (req.headers["x-access-token"] && req.userData.type === "ADMIN") {
      matchQuery = {
        $and: [
          {
            status: status.IN_PROGRESS,
            isDeleted: false,
            assignedToId: req.userData.Id,
          },
        ],
      };
    }
  }
  if (req.route.path.includes("/get-verified-applications")) {
    matchQuery = {
      $and: [{ status: status.VERIFY }, { isDeleted: false }],
    };
  }
  if (req.route.path.includes("/get-rejected-applications")) {
    matchQuery = {
      $and: [{ status: status.REJECT }, { isDeleted: false }],
    };
  }
  if (req.route.path.includes("/get-generate-applications")) {
    matchQuery = {
      $and: [{ status: status.GENERATE }, { isDeleted: false }],
    };

    if (req.headers["x-access-token"] && req.userData.type === "ADMIN") {
      matchQuery = {
        $and: [
          {
            status: "GENERATE",
            isDeleted: false,
            $or: [
              { assignedToId: req.userData.Id },
              // { generatedById: req.userData.Id },
            ],
          },
        ],
      };
    }
  }
  if (req.route.path.includes("/get-done-applications")) {
    matchQuery = {
      $and: [{ status: status.DONE }, { isDeleted: false }],
    };
  }
  if (req.route.path.includes("/get-cancelled-applications")) {
    matchQuery = {
      $and: [{ status: status.CANCELLED }, { isDeleted: false }],
    };
  }
  if (req.route.path.includes("/admin/list/payment-pending")) {
    matchQuery = {
      $and: [
        { isDeleted: false },
        {
          status: status.BLANK,
        },
      ],
    };
  }
  return matchQuery;
}
