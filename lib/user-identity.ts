export const getUserId = () => {
    if (typeof window === 'undefined') return null;
    let localId = localStorage.getItem('azkar_user_id');
    if (!localId) {
        localId = crypto.randomUUID();
        localStorage.setItem('azkar_user_id', localId);
    }
    return localId;
};
