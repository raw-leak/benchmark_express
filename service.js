export async function uploadFiles() {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(`${Date.now()}`);
        }, 500);
    });
}