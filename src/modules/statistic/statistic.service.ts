import { Service } from "typedi";
import Users from "../user/model/users.model";

@Service()
export class StatisticService {
  public CountAllUsers = async () => {
    const totalUser = await Users.countDocuments({
      $and: [{ _active: true }, { _role: 0 }],
    });

    return totalUser;
  };

  public getFiveRecentYear = async () => {
    const listYear : [string | number] = ["All years"];
    console.log("🚀 ~ StatisticService ~ getFiveRecentYear= ~ listYear:", listYear)
    const currentYear = new Date().getFullYear();

   
    for (let i = currentYear; (listYear.length <= 6 && i >= 2023) ; i-- ) {
        listYear.push(i)
    }

    listYear.sort();

    return listYear;
  }
}
