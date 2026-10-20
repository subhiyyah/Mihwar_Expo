
import api from '../api'

export const getMapNodes = async () => {
    const response = await api.get('/map-nodes')
    return response.data
}

export const getRoute = async (startNodeId, endNodeId) => {
    const response = await api.get('/navigation/route', {
        params: {
            startNodeId,
            endNodeId,
        },
    })

    return response.data
}
