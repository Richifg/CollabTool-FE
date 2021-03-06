const url = process.env.REACT_APP_SERVER_URL;
const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
const fullUrl = `${protocol}://${url}`;

const RoomService = {
    createRoom: async (password?: string): Promise<{ success: boolean; data: string }> =>
        fetch(`${fullUrl}/room`, {
            method: 'POST',
            body: JSON.stringify({ password }),
            headers: { 'Content-Type': 'application/json' },
        })
            .then((response) => {
                if (response.status !== 200) {
                    return { success: false, data: response.statusText };
                }
                return response.json().then((res) => ({ success: true, data: res }));
            })
            .catch((err) => {
                return { success: false, data: err.toString() };
            }),
    wakeUp: async (): Promise<boolean> =>
        fetch(`${fullUrl}/room`, { method: 'GET' })
            .then((res) => {
                if (res.status !== 200) return false;
                else return true;
            })
            .catch(() => false),
};

export default RoomService;
