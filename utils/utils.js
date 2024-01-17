function formatDate(dateStr) {
    const date = new Date(dateStr)
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Lưu ý rằng tháng bắt đầu từ 0
    const year = date.getFullYear().toString().slice(-2); // Lấy 2 chữ số cuối của năm
    return `${day}/${month}/${year}`;
}

function formatHour(dateStr) {
    const date = new Date(dateStr)
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

function getCurrentDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1)
        .toString()
        .padStart(2, "0");
    const day = today.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
}

module.exports = {
    formatDate,
    formatHour,
    getCurrentDate
}
