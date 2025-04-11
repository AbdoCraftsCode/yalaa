import { roletypes } from "../../DB/models/User.model.js";

export const endpoint = {
    
    create: [roletypes.User],
    freez: [roletypes.User, roletypes.Admin],
        like: [roletypes.User]
}