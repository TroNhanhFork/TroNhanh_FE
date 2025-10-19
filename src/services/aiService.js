import api from "./api"

export const sendMessage = async (message)=>{
    try{
        const res = await api.post("/ai/chat",{message});
        return res.data.reply;
    }catch(error){
        console.error("Error:",error)
        throw error;
    }
}