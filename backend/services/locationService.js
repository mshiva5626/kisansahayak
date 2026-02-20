const axios = require('axios');

const getAddressFromCoords = async (lat, lon) => {
    try {
        const response = await axios.get(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`, {
            headers: {
                'User-Agent': 'KisanApp/1.0'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Nominatim Error:', error.message);
        return { display_name: 'Unknown Location' };
    }
};

const getSatelliteImage = (lat, lon) => {
    // Returning a mock high-quality satellite image of a farm
    return "https://lh3.googleusercontent.com/aida-public/AB6AXuACsVyoaJmCRgdaK__HCBBtUFNJjH-R21jz_qlZwVRMPXpvBc9MQBZ0rhkv0PxeELwcdwV-HTzoCtH_n75HotAx7iT-f5Q_07aOcur5jqVFqp1tVKsbbdjv8nt1DSjI22MXJ3MmiZ3ueMTpdigFGK9Ibv-Uqpz7dw0HtjQLHM6S2lfM2hUolqmNicy6b-uwzZ20r7-eaIpHm_K9RaQc3cV6fPcF-NhzTIjkQdL0IKQWA6HLN6cTg0XMchsAJ2eTWrARN2vAszLSRbhi";
};

module.exports = { getAddressFromCoords, getSatelliteImage };
