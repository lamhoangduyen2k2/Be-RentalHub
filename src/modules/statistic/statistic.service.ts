import { Service } from "typedi";
import Users from "../user/model/users.model";
import { Errors } from "../../helpers/handle-errors";
import Posts from "../posts/models/posts.model";
import { UserDataResponsesDTO } from "./dto/users-data-response.dto";

@Service()
export class StatisticService {
  public CountAllUsers = async () => {
    const totalUser = await Users.countDocuments({
      $and: [{ _active: true }, { _role: 0 }],
    });

    return totalUser;
  };

  public getFiveRecentYear = async () => {
    const currentYear = new Date().getFullYear();
    const listYear: [number | string] = [currentYear];

    for (let i = currentYear - 1; listYear.length <= 6 && i >= 2023; i--) {
      listYear.unshift(i);
    }

    listYear.unshift("All years");

    return listYear;
  };

  public countNewUserByMonth = async (year: number) => {
    if (year > new Date().getFullYear()) throw Errors.YearInvalid;
    const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const countNewUsers = await Users.aggregate([
      {
        $match: {
          $and: [
            { _active: true },
            { _role: 0 },
            {
              $expr: {
                $eq: [{ $year: "$createdAt" }, year],
              },
            },
          ],
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          value: { $sum: 1 },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    const result = months.map((month) => {
      const monthData = countNewUsers.find(
        (data: unknown) => data["_id"] === month
      );
      return {
        name: month.toString(),
        value: monthData ? monthData.value : 0,
      };
    });

    return result;
  };

  public countNewUserByYear = async (year: number | string) => {
    if (typeof year === "string") {
      const years = await Users.aggregate([
        {
          $match: {
            $and: [{ _active: true }, { _role: 0 }],
          },
        },
        {
          $group: {
            _id: { $year: "$createdAt" },
            value: { $sum: 1 },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
        {
          $project: {
            _id: 0,
            name: { $toString: "$_id" },
            value: 1,
          },
        },
      ]);
      return years;
    } else {
      if (year > new Date().getFullYear()) throw Errors.YearInvalid;
      const years = await Users.aggregate([
        {
          $match: {
            $and: [
              { _active: true },
              { _role: 0 },
              {
                $expr: {
                  $eq: [{ $year: "$createdAt" }, year],
                },
              },
            ],
          },
        },
        {
          $count: "value",
        },
        {
          $project: {
            _id: 0,
            name: year.toString(),
            value: 1,
          },
        },
      ]);
      if (years.length === 0) return { name: year, value: 0 };

      return years[0];
    }
  };

  public countAllPosts = async () => {
    const totalPosts = await Posts.countDocuments();

    return totalPosts;
  };

  public countPostByMonth = async (year: number) => {
    if (year > new Date().getFullYear()) throw Errors.YearInvalid;
    const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const countPosts = await Posts.aggregate([
      {
        $match: {
          $expr: {
            $eq: [{ $year: "$createdAt" }, year],
          },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          value: { $sum: 1 },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    const result = months.map((month) => {
      const monthData = countPosts.find(
        (data: unknown) => data["_id"] === month
      );
      return {
        name: month.toString(),
        value: monthData ? monthData.value : 0,
      };
    });

    return result;
  };

  public countPostByYear = async (year: number | string) => {
    if (typeof year === "string") {
      const years = await Posts.aggregate([
        {
          $group: {
            _id: { $year: "$createdAt"},
            value: { $sum: 1 },
          },
        },
        {
          $sort: {
            _id: 1,
          },
        },
        {
          $project: {
            _id: 0,
            name: { $toString: "$_id" },
            value: 1,
          },
        },
      ]);
      return years;
    } else {
      if (year > new Date().getFullYear()) throw Errors.YearInvalid;
      const years = await Posts.aggregate([
        {
          $match: {
            $expr: {
              $eq: [{ $year: "$createdAt" }, year],
            },
          },
        },
        {
          $count: "value",
        },
        {
          $project: {
            _id: 0,
            name: year.toString(),
            value: 1,
          },
        },
      ]);
      if (years.length === 0) return { name: year, value: 0 };
      return years[0];
    }
  };

  public countPostByStatus = async () => {
    const status = ["Chờ duyệt", "Đang đăng", "Không được duyệt", "Đã gỡ", "Bị báo cáo"]
    const countPosts = await Posts.aggregate([
      {
        $group: {
          _id: "$_status",
          value: { $sum: 1 },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
      {
        $project: {
          _id: 0,
          name: "$_id",
          value: 1,
        },
      },
    ]);

    const result = status.map((item, index) => {
      const statusData = countPosts.find(
        (data: unknown) => data["name"] === index
      );
      return {
        name: item,
        value: statusData ? statusData.value : 0,
      };
    });

    return result;
  }

  public getUserData = async () => {
    const users = await Users.find({
      $and: [{ _isHost: false }, { _role: 0 }],
    });

    return UserDataResponsesDTO.toResponse(users);
  };

  public getHostData = async () => {
    const users = await Users.aggregate([
      {
        $match: {
          $and: [{ _isHost: true }, { _role: 0 }],
        },
      },
      {
        $lookup: {
          from: "indentities",
          localField: "_id",
          foreignField: "_uId",
          as: "identities",
        },
      },
      {
        $unwind: {
          path: "$identities",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          _fname: 1,
          _lname: 1,
          _email: 1,
          _phone: 1,
          _isHost: 1,
          _address: "$identities._address",
          _loginType: 1,
          _dob: "$identities._dob",
          _home: "$identities._home",
          _gender: "$identities._gender",
          _nationality: "$identities._nationality",
          _features: "$identities._features",
          _issueDate: "$identities._issueDate",
          _doe: "$identities._doe",
          _issueLoc: "$identities._issueLoc",
          _type: "$identities._type",
          _addressRental: 1,
          _totalReported: 1,
        },
      },
    ]);
    if (users.length <= 0) throw Errors.UserNotFound;

    return users;
  };

  public getInspectorData = async () => {
    const inspectors = await Users.find({
      _role: 2,
    });
    if (inspectors.length <= 0) throw Errors.UserNotFound;

    return UserDataResponsesDTO.toResponse(inspectors);
  };
}
