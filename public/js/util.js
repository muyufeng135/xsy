/**
 * Excel 公式计算：IF(flag, CEILING(b4*(1+b2)/g5, 1)*2+b8, CEILING(b4*(1+b2)/g5, 1)+b8)
 * @param {boolean} flag - 为 true 时执行 CEILING*2+B8，为 false 时执行 CEILING+B8
 * @param {number} points - 对应 Excel B4 单元格
 * @param {number} spare - 对应 Excel $B$2 单元格，此值是一个百分数
 * @param {number} slotCount - 对应 Excel G5 单元格
 * @param {number} moduleAdd - 对应 Excel B8 单元格
 * @param {boolean} [independentFlag] - 为 true 时结果为 max(上述计算值, 3)；未传或为 false 时取计算值
 * @returns {number}
 */
function calcMouduleQuantity(flag, points, spare, slotCount, moduleAdd, independentFlag) {
    points = points || 0;
    spare = spare || 0;
    moduleAdd = moduleAdd || 0;
    if (!slotCount || slotCount === 0) return 0;
    var base = Math.ceil(points * (1 + spare) / slotCount);
    var result = flag ? base * 2 + moduleAdd : base + moduleAdd;
    if (independentFlag) {
        return Math.max(result, 3);
    }
    return result;
}
/**
 * 根据主产品ID查询产品包信息
 * @param {String} mainProductId - 主产品ID（productPackage__c的外键mainProduct__c）
 * @returns {Promise} 返回查询到的records数组
 */
var queryPackageItems = function (mainProductId) {
	return new Promise(function (resolve, reject) {
		if (!mainProductId) {
			resolve([]);
			return;
		}
		let param = {};
		param.xoql = "select subProduct__c.name as name ,quantity__c from productPackage__c where masterProductCode__c='" + mainProductId + "'";
		param.useSimpleCode = true;
		var config = {
			method: 'post',
			url: '/rest/data/v2.0/query/xoql',
			contentType: 'application/x-www-form-urlencoded',
			data: param
		};
		lapp.connection.invoke(config)
			.then(function (response) {
				if (response.data && response.data.code === '200') {
					var result = response.data && response.data.data;
					if (result.count > 0) {
						resolve(result.records);
					} else {
						resolve([]);
					}
				} else {
					resolve([]);
				}
			})
			.catch(function (error) {
				console.error('查询产品包发生异常:', error);
				reject(error);
			});
	});
}

/** HIQuadX 点数项名中的类型码 -> 物料 quantity 项名中的模块段（不含前缀 HIQuadX_ 与末尾序号） */
var HIQuadX_POINTS_TYPE_TO_MODULE = {
	AI: 'AnalogInputModule',
	AO: 'AnalogOutputModule',
	DI: 'DigitalInputModule',
	DO: 'DigitalOutputModule',
	CI: 'CIModule'
};

var HIQuadX_RECALC_TYPE_CODES = Object.keys(HIQuadX_POINTS_TYPE_TO_MODULE);
/** 全局 spare / 冗余变更时，对每类通道最多尝试的序号上限（无物料信息则内部直接 return） */
var HIQuadX_RECALC_INDEX_MAX = 8;
/** 扩展机架数量配置项 */
var HIQuadX_EXTENDED_RACK_NAME = 'HIQuadX_ExtendedRack';

function sumHIQuadXModuleQuantities() {
	var sum = 0;
	for (var t = 0; t < HIQuadX_RECALC_TYPE_CODES.length; t++) {
		var tc = HIQuadX_RECALC_TYPE_CODES[t];
		var mid = HIQuadX_POINTS_TYPE_TO_MODULE[tc];
		for (var idx = 1; idx <= HIQuadX_RECALC_INDEX_MAX; idx++) {
			sum += getItemQuantity('HIQuadX_' + mid + idx);
		}
	}
	return sum;
}

/**
 * 所有 HIQuadX 模块数量之和，按扩展机架物料 slotCount 折算为机架数；
 * flag（HIQuadX_IORedundant）为 true 时：ceil(和 / slotCount) * 2；否则 ceil(和 / slotCount)。
 */
function recalcHIQuadXExtendedRack() {
	if (typeof vue === 'undefined' || !vue || !vue.$data || !vue.$data.itemApiKeys) {
		return;
	}
	if (!vue.$data.itemApiKeys.hasOwnProperty(HIQuadX_EXTENDED_RACK_NAME)) {
		return;
	}
	var flag = !!getItemValue('HIQuadX_IORedundant');
	var sumMod = sumHIQuadXModuleQuantities();
	var rackInfo = getItemInfo(HIQuadX_EXTENDED_RACK_NAME);
	var slotCount = rackInfo && rackInfo.slotCount__c != null ? Number(rackInfo.slotCount__c) : 0;
	if (!slotCount || slotCount <= 0) {
		setItemQuantity(HIQuadX_EXTENDED_RACK_NAME, 0);
		return;
	}
	var base = Math.ceil(sumMod / slotCount);
	var result = flag ? base * 2 : base;
	setItemQuantity(HIQuadX_EXTENDED_RACK_NAME, result);
}

function isHIQuadXComputedModuleQuantityKey(p) {
	if (typeof p !== 'string') {
		return false;
	}
	for (var k in HIQuadX_POINTS_TYPE_TO_MODULE) {
		if (!HIQuadX_POINTS_TYPE_TO_MODULE.hasOwnProperty(k)) {
			continue;
		}
		var mid = HIQuadX_POINTS_TYPE_TO_MODULE[k];
		if (new RegExp('^HIQuadX_' + mid + '\\d+$').test(p)) {
			return true;
		}
	}
	return false;
}

/**
 * 解析 HIQuadX 模块类下拉项 name（如 HIQuadX_AnalogInputModule1）为类型码与序号。
 * @returns {{ typeCode: string, index: string }|null}
 */
function parseHIQuadXModuleSelectItemName(p) {
	if (typeof p !== 'string') {
		return null;
	}
	for (var typeCode in HIQuadX_POINTS_TYPE_TO_MODULE) {
		if (!HIQuadX_POINTS_TYPE_TO_MODULE.hasOwnProperty(typeCode)) {
			continue;
		}
		var mid = HIQuadX_POINTS_TYPE_TO_MODULE[typeCode];
		var matched = p.match(new RegExp('^HIQuadX_' + mid + '(\\d+)$'));
		if (matched) {
			return { typeCode: typeCode, index: matched[1] };
		}
	}
	return null;
}

/**
 * selectChange 专用：模块下拉变更时用当前选中项的 productInfo.slotCount__c（经 getItemInfo）参与计算；
 * 其它 HIQuadX 下拉与 numChange 规则一致。
 * @param {string} p item.name
 */
function recalcHIQuadXModulesForSelectChange(p) {
	if (typeof p !== 'string' || p.indexOf('HIQuadX_') !== 0) {
		return;
	}
	if (p === HIQuadX_EXTENDED_RACK_NAME) {
		recalcHIQuadXExtendedRack();
		return;
	}
	var parsed = parseHIQuadXModuleSelectItemName(p);
	if (parsed) {
		calcHIQuadXModuleQuantityForTypeIndex(parsed.typeCode, parsed.index);
		return;
	}
	recalcHIQuadXModulesForNumChange(p);
}

/**
 * 按类型与序号计算并写回对应 HIQuadX 模块数量（由点数、冗余、余量、ModuleADD 等共同决定）。
 * @param {string} typeCode AI|AO|DI|DO|CI
 * @param {string} index 数字序号字符串，如 "1"
 */
/** AI / DI / DO 独立 2oo3 模块开关：HIQuadX_{类型}2oo3IndependentModuleEnable{序号} */
function getHIQuadX2oo3IndependentFlag(typeCode, index) {
	if (typeCode !== 'AI' && typeCode !== 'DI' && typeCode !== 'DO') {
		return false;
	}
	return !!getItemValue('HIQuadX_' + typeCode + '2oo3IndependentModuleEnable' + index);
}

function calcHIQuadXModuleQuantityForTypeIndex(typeCode, index, opts) {
	opts = opts || {};
	var moduleMiddle = HIQuadX_POINTS_TYPE_TO_MODULE[typeCode];
	if (!moduleMiddle) {
		return;
	}
	var moduleItemName = 'HIQuadX_' + moduleMiddle + index;
	var pointsKey = 'HIQuadX_' + typeCode + 'Points' + index;
	var moduleAddKey = 'HIQuadX_' + typeCode + 'ModuleADD' + index;
	var flag = !!getItemValue('HIQuadX_IORedundant');
	var spare = getItemValue('HIQuadX_IOSpare') / 100;
	var points = getItemValue(pointsKey);
	var moduleInfo = getItemInfo(moduleItemName);
	if (!moduleInfo || moduleInfo.slotCount__c == null) {
		return;
	}
	var slotCount = moduleInfo.slotCount__c;
	var moduleAdd = getItemValue(moduleAddKey);
	var independentFlag = getHIQuadX2oo3IndependentFlag(typeCode, index);
	var result = calcMouduleQuantity(flag, points, spare, slotCount, moduleAdd, independentFlag);
	setItemQuantity(moduleItemName, result);
	if (!opts.skipExtendedRack) {
		recalcHIQuadXExtendedRack();
	}
}

function recalcAllHIQuadXModuleQuantities() {
	for (var t = 0; t < HIQuadX_RECALC_TYPE_CODES.length; t++) {
		var tc = HIQuadX_RECALC_TYPE_CODES[t];
		for (var idx = 1; idx <= HIQuadX_RECALC_INDEX_MAX; idx++) {
			calcHIQuadXModuleQuantityForTypeIndex(tc, String(idx), { skipExtendedRack: true });
		}
	}
	recalcHIQuadXExtendedRack();
}

/**
 * 根据点数配置项名（如 HIQuadX_AIPoints1）计算对应槽位模块数量并写回。
 * 命名：HIQuadX_{类型}Points{序号} -> HIQuadX_{模块英文}{序号}、HIQuadX_{类型}ModuleADD{序号}
 * @param {string} p 与 numChange 一致的 item.name，须匹配 HIQuadX_(AI|AO|DI|DO|CI)Points\d+
 */
var calcHIQuadXModuleQuantity = function (p) {
	if (typeof p !== 'string') {
		return;
	}
	var matched = p.match(/^HIQuadX_(AI|AO|DI|DO|CI)Points(\d+)$/);
	if (!matched) {
		return;
	}
	calcHIQuadXModuleQuantityForTypeIndex(matched[1], matched[2]);
};

/**
 * HIQuadX 相关字段变更时重算模块数量：用于 numChange（数量输入）、switchChange（开关）等；
 * 不含「模块型号下拉」项（见 recalcHIQuadXModulesForSelectChange，避免与 setItemQuantity 联动死循环）。
 * 除点数外，ModuleADD、IOSpare、IORedundant 等变化也会重算；未识别的 HIQuadX_ 键则重算全部通道（避免漏项）。
 * @param {string} p item.name
 */
var recalcHIQuadXModulesForNumChange = function (p) {
	if (typeof p !== 'string' || p.indexOf('HIQuadX_') !== 0) {
		return;
	}
	if (p === HIQuadX_EXTENDED_RACK_NAME) {
		return;
	}
	if (isHIQuadXComputedModuleQuantityKey(p)) {
		return;
	}
	if (p === 'HIQuadX_IORedundant' || p === 'HIQuadX_IOSpare') {
		recalcAllHIQuadXModuleQuantities();
		return;
	}
	var mPoints = p.match(/^HIQuadX_(AI|AO|DI|DO|CI)Points(\d+)$/);
	if (mPoints) {
		calcHIQuadXModuleQuantityForTypeIndex(mPoints[1], mPoints[2]);
		return;
	}
	var mAdd = p.match(/^HIQuadX_(AI|AO|DI|DO|CI)ModuleADD(\d+)$/);
	if (mAdd) {
		calcHIQuadXModuleQuantityForTypeIndex(mAdd[1], mAdd[2]);
		return;
	}
	var m2oo3 = p.match(/^HIQuadX_(AI|DI|DO)2oo3IndependentModuleEnable(\d+)$/);
	if (m2oo3) {
		calcHIQuadXModuleQuantityForTypeIndex(m2oo3[1], m2oo3[2]);
		return;
	}
	recalcAllHIQuadXModuleQuantities();
};
