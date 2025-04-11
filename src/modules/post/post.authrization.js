import { roletypes } from "../../DB/models/User.model.js";

export const endpoint = {
    
    createPost: [roletypes.User],
    freezpost: [roletypes.User, roletypes.Admin],
        likePost: [roletypes.User]
}
