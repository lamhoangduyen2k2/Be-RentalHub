import { Service } from "typedi";
import Users from "../user/model/users.model";
import { Errors } from "../../helpers/handle-errors";

@Service()
export class StatisticService {
  public CountAllUsers = async () => {
    const totalUser = await Users.countDocuments({
      $and: [{ _active: true }, { _role: 0 }],
    });

    return totalUser;
  };

  public getFiveRecentYear = async () => {
    const listYear: [string | number] = ["All years"];
    console.log(
      "🚀 ~ StatisticService ~ getFiveRecentYear= ~ listYear:",
      listYear
    );
    const currentYear = new Date().getFullYear();

    for (let i = currentYear; listYear.length <= 6 && i >= 2023; i--) {
      listYear.push(i);
    }

    listYear.sort();

    return listYear;
  };

  public countNewUserByMonth = async (year: number) => {
    if (year > new Date().getFullYear()) throw Errors.YearInvalid;
    const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
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
          "_id": 1,
        },
      },
    ]);

    const result = months.map(month => {
      const monthData = countNewUsers.find((data: unknown) => data["_id"] === month);
      return {
        month,
        value: monthData ? monthData.value : 0,
      };
    })

    return result;
  };

  public countNewUserByYear = async (year: number | string) => {
    if (typeof year === "string") {
      const years = await Users.aggregate([
        {
          $match: {
            $and: [
              { _active: true },
              { _role: 0 },
            ],
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
            "_id": 1,
          },
        },
        {
          $project: {
            _id: 0,
            name: "$_id",
            value: 1,
          }
        }
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
          }
        }
      ]);
      if (years.length === 0) return { name: year, value: 0}

      return years[0];
    }
    

  };
}
