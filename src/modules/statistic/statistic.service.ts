import { Service } from "typedi";
import Users from "../user/model/users.model";
import { Errors } from "../../helpers/handle-errors";
import Posts from "../posts/models/posts.model";
import { UserDataResponsesDTO } from "./dto/users-data-response.dto";
import UserBlocked from "../user/model/user-blocked.model";

@Service()
export class StatisticService {
  public CountAllUsers = async () => {
    const totalUser = await Users.countDocuments({
      $and: [{ _active: true }, { _role: 0 }, { _isHost: false }],
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

  public countNewUserByMonth = async (year: number, host: boolean = false) => {
    if (year > new Date().getFullYear()) throw Errors.YearInvalid;
    const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    //Set condition for qưery
    const condition = {
      $and: [
        { _active: true },
        { _role: 0 },
        { $expr: { $eq: [{ $year: "$createdAt" }, year] } },
        { _isHost: false },
      ],
    };

    if (host) condition.$and.splice(3, 1);

    const countNewUsers = await Users.aggregate([
      {
        $match: condition,
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

  public countNewUserByYear = async (
    year: number | string,
    host: boolean = false
  ) => {
    if (typeof year === "string") {
      const condition = {
        $and: [{ _active: true }, { _role: 0 }, { _isHost: false }],
      };

      if (host) condition.$and.splice(2, 1);

      const years = await Users.aggregate([
        {
          $match: {
            $and: [{ _active: true }, { _role: 0 }, { _isHost: host }],
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
      const condition = {
        $and: [
          { _active: true },
          { _role: 0 },
          { $expr: { $eq: [{ $year: "$createdAt" }, year] } },
          { _isHost: false },
        ],
      };

      if (host) condition.$and.splice(3, 1);

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

  public countUserByStatus = async () => {
    const status = ["Active", "Inactive"];
    const result = [];

    const countUsers = await Users.aggregate([
      {
        $match: {
          $and: [{ _role: 0 }, { _isHost: false }],
        },
      },
      {
        $group: {
          _id: "$_active",
          value: { $sum: 1 },
        },
      },
      {
        $sort: {
          _id: -1,
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

    status.forEach((item, index) => {
      result.push({
        name: item,
        value: countUsers[index] ? countUsers[index].value : 0,
      });
    });

    return result;
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
    const status = [
      "Chờ duyệt",
      "Đang đăng",
      "Không được duyệt",
      "Đã gỡ",
      "Bị báo cáo",
    ];
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
  };

  public getUserData = async () => {
    const users = await Users.find({
      $and: [{ _isHost: false }, { _role: 0 }],
    });

    return UserDataResponsesDTO.toResponse(users);
  };

  public countAllHost = async () => {
    const totalHost = await Users.countDocuments({
      $and: [{ _active: true }, { _role: 0 }, { _isHost: true }],
    });

    return totalHost;
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
          //_address: "$identities._address",
          _loginType: 1,
          // _dob: "$identities._dob",
          // _home: "$identities._home",
          // _gender: "$identities._gender",
          // _nationality: "$identities._nationality",
          // _features: "$identities._features",
          // _issueDate: "$identities._issueDate",
          // _doe: "$identities._doe",
          // _issueLoc: "$identities._issueLoc",
          // _type: "$identities._type",
          _addressRental: 1,
          _totalReported: 1,
        },
      },
    ]);
    if (users.length <= 0) throw Errors.UserNotFound;

    users.forEach((user) => {
      user._addressRental = user._addressRental.length;
    });

    return users;
  };

  public countHostByYear = async (year: number | string) => {
    if (typeof year === "string") {
      const years = await Users.aggregate([
        {
          $match: {
            $and: [{ _active: true }, { _role: 0 }, { _isHost: true }],
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

  public countHostByMonth = async (year: number) => {
    if (year > new Date().getFullYear()) throw Errors.YearInvalid;
    const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const countNewUsers = await Users.aggregate([
      {
        $match: {
          $and: [
            { _active: true },
            { _role: 0 },
            { _isHost: true },
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

  public countHostByStatus = async () => {
    const status = ["Active", "Inactive"];

    const totalActiveHost = await Users.countDocuments({
      $and: [{ _active: true }, { _role: 0 }, { _isHost: true }],
    });

    const totalInactiveHost = await UserBlocked.countDocuments();

    const result = [
      { name: status[0], value: totalActiveHost },
      { name: status[1], value: totalInactiveHost },
    ];

    return result;
  };

  public countAllInspector = async () => {
    const totalInspector = await Users.countDocuments({
      $and: [{ _active: true }, { _role: 2 }],
    });

    return totalInspector;
  };

  public getInspectorData = async () => {
    const inspectors = await Users.find({
      _role: 2,
    });
    if (inspectors.length <= 0) throw Errors.UserNotFound;

    return UserDataResponsesDTO.toResponse(inspectors);
  };

  public countInspectorByYear = async (year: number | string) => {
    if (typeof year === "string") {
      const years = await Users.aggregate([
        {
          $match: {
            $and: [{ _active: true }, { _role: 2 }],
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
              { _role: 2 },
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

  public countInspectorByMonth = async (year: number) => {
    if (year > new Date().getFullYear()) throw Errors.YearInvalid;
    const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const countNewUsers = await Users.aggregate([
      {
        $match: {
          $and: [
            { _active: true },
            { _role: 2 },
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

  public countInspectorByStatus = async () => {
    const status = ["Active", "Inactive"];
    const result = [];

    const countInspector = await Users.aggregate([
      {
        $match: {
          _role: 2,
        },
      },
      {
        $group: {
          _id: "$_active",
          value: { $sum: 1 },
        },
      },
      {
        $sort: {
          _id: -1,
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

    status.forEach((item, index) => {
      result.push({
        name: item,
        value: countInspector[index] ? countInspector[index].value : 0,
      });
    });

    return result;
  };

  public countHostandUserByMonth = async (year: number) => {
    const result = [
      { name: "Hosts", series: [] },
      { name: "Người dùng", series: [] },
    ];

    const totalHost = await this.countHostByMonth(year);
    const totalUser = await this.countNewUserByMonth(year);

    result[0].series = totalHost;
    result[1].series = totalUser;

    return result;
  };

  public countHostandUserByYear = async (year: number | string) => {
    const result = [
      { name: "Hosts", series: [] },
      { name: "Người dùng", series: [] },
    ];
    const currentYear = new Date().getFullYear();

    const totalHost = await this.countHostByYear(year);
    const totalUser = await this.countNewUserByYear(year);

    for (let i = currentYear; i >= 2023; i--) {
      const hostData = totalHost.find((data : unknown) => data["name"] === i.toString());
      const userData = totalUser.find((data : unknown) => data["name"] === i.toString());

      result[0].series.push({
        name: i.toString(),
        value: hostData ? hostData.value : 0,
      });

      result[1].series.push({
        name: i.toString(),
        value: userData ? userData.value : 0,
      });
    }

    return result;
  };

  public countEmployeeandUserByMonth = async (year: number) => {
    const result = [
      { name: "Nhân viên", series: [] },
      { name: "Người dùng", series: [] },
    ];

    const totalInspector = await this.countInspectorByMonth(year);
    const totalUser = await this.countNewUserByMonth(year, true);

    result[0].series = totalInspector;
    result[1].series = totalUser;

    return result;
  };

  public countEmployeeandUserByYear = async (year: number | string) => {
    const result = [
      { name: "Nhân viên", series: [] },
      { name: "Người dùng", series: [] },
    ];

    const currentYear = new Date().getFullYear();

    const totalInspector = await this.countInspectorByYear(year);
    const totalUser = await this.countNewUserByYear(year, true);

    for (let i = currentYear; i >= 2023; i--) {
      const inspectorData = totalInspector.find((data : unknown) => data["name"] === i.toString());
      const userData = totalUser.find((data : unknown) => data["name"] === i.toString());

      result[0].series.push({
        name: i.toString(),
        value: inspectorData ? inspectorData.value : 0,
      });

      result[1].series.push({
        name: i.toString(),
        value: userData ? userData.value : 0,
      });
    }

    return result;
  };
}
