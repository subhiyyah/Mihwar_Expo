
import api from '../api'

const USER_ID = 1

export const getPassport = async () => {
    const response = await api.get(
        `/user-destination-progress/user/${USER_ID}/passport`
    )
    return response.data
}

export const getPassportProgress = async () => {
    const response = await api.get(
        `/user-destination-progress/user/${USER_ID}/passport/progress`
    )
    return response.data
}
