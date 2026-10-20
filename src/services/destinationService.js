
import api from '../api'

export const getDestinations = async () => {
    const response = await api.get('/destinations')

    console.log('Destinations API response:', response.data)

    if (!Array.isArray(response.data)) {
        throw new Error('Destinations response is not an array')
    }

    return response.data
}
