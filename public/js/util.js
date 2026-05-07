/**
 * Excel 公式计算：IF(flag, CEILING(b4*(1+b2)/g5, 1)*2+b8, CEILING(b4*(1+b2)/g5, 1)+b8)
 * @param {boolean} flag - 为 true 时执行 CEILING*2+B8，为 false 时执行 CEILING+B8
 * @param {number} pointBuff - 对应 Excel B4 单元格
 * @param {number} b2 - 对应 Excel $B$2 单元格
 * @param {number} g5 - 对应 Excel G5 单元格
 * @param {number} b8 - 对应 Excel B8 单元格
 * @returns {number}
 */
function calcMouduleQuantity(flag, pointBuff, b2, g5, b8) {
    pointBuff = pointBuff || 0;
    b2 = b2 || 0;
    b8 = b8 || 0;
    if (!g5 || g5 === 0) return 0;
    var base = Math.ceil(b4 * (1 + b2) / g5);
    return flag ? base * 2 + b8 : base + b8;
}
