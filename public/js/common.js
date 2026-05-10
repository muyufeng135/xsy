var systemTypeMap = { "SIS1": 1, "SIS3": 2, "TMC1": 3, "TMC2": 5, "iMEC": 6, "SIS2": 7 };
var seriesTypeMap = { "TSxPlus黑色": 10, "TSxPlus灰色": 11, "TSxPlusSY": 12, "EDPF": 13 };//TODO 上线生产这里需要调整
var customTypeMap = { "国内客户": 1, "国际客户": 2 };
//let baseUrl="https://api-p05.xiaoshouyi.com";
var TcCardCode = "01-01-01-07-00-04";
var DEFAULT_REMOTE_NAME = "远程系统配置";
/**
 * @param {Object} name
 * 根据参数名称截取参数值
 */
var getQueryString = function (name) {
	var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
	var r = window.location.search.substr(1).match(reg);
	if (r != null) {
		return decodeURIComponent(r[2]);
	}
	return '';
}
var checkLeave = function (e) {
	e = window.event || e;
	e.returnValue = "确定离开当前页面吗？";
}
//获取计算逻辑开、关
var getSwitch = function () {
	return new Promise((resolve, reject) => {
		let rconfig = {
			method: 'get',
			url: "/rest/data/v2/query?q=select id,customItem279__c,customItem227__c,customItem283__c,customItem284__c from _order where id=" + vue.$data.orderId,
			contentType: 'application/json'

		};
		lapp.connection.invoke(rconfig).then(res => {
			if (res.status == 200 && res.data) {
				if (res.data.code == 200 && res.data.result) {
					if (res.data.result.records.length) {
						let arr = res.data.result.records
						if (arr[0].customItem279__c == 1) {
							// vue.$data.switchFlag=true;
							vue.$data.discountOptions.forEach(item => {
								if (item.value == '1') {
									item.disabled = true
								}
							})
							resolve(vue.$data.switchFlag)
						} else {
							// vue.$data.switchFlag=false;
							vue.$data.discountOptions.forEach(item => {
								if (item.value == '1') {
									item.disabled = false
								}
							})
							resolve(vue.$data.switchFlag)
						}
					}
				}
			} else {
				resolve(false)
			}
		})
	})

}
//如果是复制、编辑 的操作需要先根据configId 查询对应模板(当前编辑)的配置内容加载过来
// configTypeId 以及其他预配置参数
var queryCopyOrEditId = function () {

	return new Promise((resolve, reject) => {
		vue.$data.defaultItems = []
		let configId = getQueryString('configId');
		let operate = getQueryString('operateType');
		let orderId = getQueryString('orderId');
		debugger;
		if (configId) {
			debugger;
			if (operate && operate == 'copy') {
				vue.$data.orderId = orderId;
				vue.$data.srcConfigId = configId;//好像不用增加这个属性
			} else {
				vue.$data.configId = configId;
			}
			var config = {
				method: 'get',
				url: '/rest/data/v2.0/scripts/api/neocrm/bom/query/bom?configId=' + configId,
				contentType: 'application/json'
			};
			lapp.connection.invoke(config)
				.then(function (res) {
					debugger;
					if (res.data) {
						debugger;
						if (res.data.config.order__c) {
							vue.$data.orderId = res.data.config.order__c;
						}

						if (res.data.config.configType__c) {
							vue.$data.configType = res.data.config.configType__c;
							let configType = "";
							if (vue.$data.configTypes && vue.$data.configTypes.length > 0) {
								let configTypeItem = vue.$data.configTypes.find(item => item.value == res.data.config.configType__c);
								if (configTypeItem) {
									configType = configTypeItem.label;
								}
							}

						}



						//当是编辑Bom配置时需要设定对应订单ID
						if (operate == 'edit') {
							vue.$data.orderId = res.data.config.order__c;
							vue.$data.configName = res.data.config.name;//用于展示
							let systemType = "";
							switch (res.data.config.systemType__c) {
								case 1:
									systemType = "SIS1";
									break;
								case 2:
									systemType = "SIS3";
									break;
								case 3:
									systemType = "TMC1";
									break;
								case 4:
									systemType = "DEH";
									break;
								case 5:
									systemType = "TMC2";
									break;
								case 6:
									systemType = "iMEC";
									break;
								case 7:
									systemType = "SIS2";
									break;

							}
							//判断系统类型
							let systemTypeInThreeValue = "";
							if (systemType != "" && (systemType == "SIS1" || systemType == "SIS2" || systemType == "SIS3")) {
								systemTypeInThreeValue = "SIS";
							}
							else if (systemType != "" && (systemType == "TMC1" || systemType == "DEH" || systemType == "TMC2" || systemType == "iMEC")) {
								systemTypeInThreeValue = "CCS";
							}
							let preParam = "";
							if (systemTypeInThreeValue && systemTypeInThreeValue != '') {
								let systemTypeInThreeKey = "itemValue::preparam::systemTypeInThree";//预设定参数
								vue.$set(vue.$data.itemApiKeys, "ProjTypeSelectParam", systemTypeInThreeKey);
								vue.$set(vue.$data.itemValues, systemTypeInThreeKey, systemTypeInThreeValue);
								preParam = preParam + "ProjTypeSelectParam=" + systemTypeInThreeValue + ";";
							}
							let systemTypeSelectKey = "itemValue::preparam::systemType";//预设定参数
							if (systemType && systemType != "") {
								vue.$set(vue.$data.itemApiKeys, "systemType", systemTypeSelectKey);
								vue.$set(vue.$data.itemValues, systemTypeSelectKey, systemType);
								preParam += ("systemType=" + systemType + ";");
							}
							if (res.data.config.configType__c == 3) {
								let seriesType = "";
								if (res.data.config.seriesType__c == 10) {
									seriesType = "TSxPlus黑色";
								} else if (res.data.config.seriesType__c == 11) {
									seriesType = "TSxPlus灰色";
								} else if (res.data.config.seriesType__c == 12) {
									seriesType = "TSxPlusSY";
								} else if (res.data.config.seriesType__c == 13) {
									seriesType = "EDPF";
								}
								//只有当配置类型是TSxPlus时才会传递CPU 系列参数 该参数作为查询时的整体参数
								let CPU_SelectKey = "itemValue::preparam::CPU_Select";//预设定参数
								vue.$set(vue.$data.itemApiKeys, "CPU_Select", CPU_SelectKey);
								vue.$set(vue.$data.itemValues, CPU_SelectKey, seriesType);
								if (seriesType && seriesType != "") {
									preParam += ("CPU_Select=" + seriesType + ";");

								}
							}
							if (preParam.lastIndexOf(";") == preParam.length - 1) {
								preParam = preParam.substring(0, preParam.length - 1);
							}
							if (preParam != "") {
								vue.$data.preParam = preParam;
							}
						}
						if (res.data.config.lockStatus) {
							if (res.data.config.lockStatus.indexOf('未锁定') != -1) {
								vue.$data.lockStatus = false
							} else {
								vue.$data.lockStatus = true
							}
						} else {
							vue.$data.lockStatus = false
						}
						if (res.data.config.remoteConfigTitles__c) {
							vue.$data.defaultSteps = res.data.config.remoteConfigTitles__c
						}
						for (let key in res.data.config) {
							vue.$data.copyInfo[key] = res.data.config[key]
						}
						//是否启用计算逻辑
						if (operate == 'edit' && res.data.config.enableAutoCalc__c != undefined) {
							vue.$data.enableAutoCalc = (res.data.config.enableAutoCalc__c == 0 || res.data.config.enableAutoCalc__c == false) ? 'false' : 'true';
							let autoCalc = { label: "是否开启自动计算", value: vue.$data.enableAutoCalc == "true" ? "是" : "否" };
							vue.$data.showInMiniWindow.push(autoCalc);
						}
						if (res.data.config.configType__c) {

							let configTypeItem = vue.$data.configTypes.find(item => item.value == res.data.config.configType__c);
							if (configTypeItem) {
								vue.$data.configTypeId = configTypeItem.code;
								vue.$data.series = configTypeItem.label;
							}

							initDisable()//设置不可用的
						}
						if (res.data.items && res.data.items.length) {
							vue.$data.defaultItems = res.data.items
						}
						if (res.data.config.currencyUnit) {
							vue.$data.currencyUnit = res.data.config.currencyUnit
						}
						if (res.data.config.customType__c) {
							vue.$data.customType__c = res.data.config.customType__c
						}
						resolve(vue.$data.configTypeId)
					}
				})
				.catch(function (error) {
					console.log(error);
				});
		}
	})

}

var initPage = function () {
	let url = window.location.origin;
	debugger;
	queryConfigTypeOptions();
	let userId = getQueryString("userId");
	vue.$data.duanpei = userId;
	let seriesType = getQueryString("seriesType");//TsxPlusCPU系列
	let systemType = getQueryString("systemType");//systemType
	let customType = getQueryString("customType");//用户类型
	let configType = getQueryString("configType");//产品类型
	let orderId = getQueryString("orderId");//所属订单
	let enableAutoCalc = getQueryString("enableAutoCalc");//是否开启计算逻辑
	vue.$data.enableAutoCalc = enableAutoCalc;
	if (getQueryString("configName") != "") {
		vue.$data.configName = getQueryString("configName");
	}
	vue.$data.orderId = orderId;
	vue.$data.systemType = systemType;
	vue.$data.customType = customType;
	if (configType != "") {
		let configTypeItem = { label: "配置类型", value: configType };
		vue.$data.showInMiniWindow.push(configTypeItem);
	}
	if (customType != "") {
		let customTypeItem = { label: "客户类型", value: customType };
		vue.$data.showInMiniWindow.push(customTypeItem);
	}
	if (seriesType != "") {
		let seriesTypeItem = { label: "所属系列", value: seriesType };
		vue.$data.showInMiniWindow.push(seriesTypeItem);
	}
	if (systemType != "") {
		let systemTypeItem = { label: "系统类型", value: systemType };
		vue.$data.showInMiniWindow.push(systemTypeItem);
	}

	//这里是将预配置界面传入的一些参数作为查询条件使用时放入到vue.$data.itemApiKeys和vue.$data.itemValues中

	let systemTypeInThreeValue = "";
	if (systemType != "" && (systemType == "SIS1" || systemType == "SIS2" || systemType == "SIS3")) {
		systemTypeInThreeValue = "SIS";
	} else if (systemType != "" && (systemType == "TMC1" || systemType == "DEH" || systemType == "TMC2" || systemType == "iMEC")) {
		systemTypeInThreeValue = "CCS";
	}
	let preParam = "";

	if (systemTypeInThreeValue && systemTypeInThreeValue != '') {
		let systemTypeInThreeKey = "itemValue::preparam::systemTypeInThree";//预设定参数
		vue.$set(vue.$data.itemApiKeys, "ProjTypeSelectParam", systemTypeInThreeKey);
		vue.$set(vue.$data.itemValues, systemTypeInThreeKey, systemTypeInThreeValue);
		preParam = preParam + "ProjTypeSelectParam=" + systemTypeInThreeValue + ";";
	}

	let systemTypeSelectKey = "itemValue::preparam::systemType";//预设定参数
	if (systemType && systemType != "") {
		vue.$set(vue.$data.itemApiKeys, "systemType", systemTypeSelectKey);
		vue.$set(vue.$data.itemValues, systemTypeSelectKey, systemType);
		preParam += ("systemType=" + systemType + ";");
	}
	if (configType == "TSxPlus") {
		//只有当配置类型是TSxPlus时才会传递CPU 系列参数 该参数作为查询时的整体参数
		let CPU_SelectKey = "itemValue::preparam::CPU_Select";//预设定参数
		vue.$set(vue.$data.itemApiKeys, "CPU_Select", CPU_SelectKey);
		vue.$set(vue.$data.itemValues, CPU_SelectKey, seriesType);
		if (seriesType != "") {
			preParam += ("CPU_Select=" + seriesType + ";");
		}
	}
	if (preParam.lastIndexOf(";") == preParam.length - 1) {
		preParam = preParam.substring(0, preParam.length - 1);
	}
	if (preParam != "") {
		vue.$data.preParam = preParam;
	}

	let configId = getQueryString('configId');
	if (configId != "") {
		queryCopyOrEditId().then(res => {
			queryconfigTypes();
			//queryProjectType();
			setTimeout(function () {
				//initDefaultQuantity();
			}, 500)
		});
	}
	// else branch: queryconfigTypes will be called after queryConfigTypeOptions completes

}
/**
 * 查询订单的项目类型，后面计算服务人天使用。
 */
var queryProjectType = function () {
	if (vue.$data.orderId != "") {
		let config = {
			method: 'get',
			url: "/rest/data/v2/query?q=select id,customItem242__c,currencyUnit from _order where id=" + vue.$data.orderId,
			contentType: 'application/json'

		};
		lapp.connection.invoke(config).then(function (response) {
			if (response.data && response.data.code == 200) {
				if (response.data.result && response.data.result.records.length) {
					let a = response.data.result.records[0];
					if (a.customItem242__c == "新建") {
						vue.$data.projectType = a.customItem242__c;
					} else if (a.customItem242__c == "改造" || a.customItem242__c == "系统优化及服务") {
						vue.$data.projectType = "改造";
					}
					vue.$data.currencyUnit = a.currencyUnit == 1 ? "人民币" : "美元";
					queryMpdLimits();
				}
			}
		}).catch(function (ex) {
			console.error("查询项目类型发生异常:" + ex)
		});
	}

}
var getFrameItems = function (customItem272) { // 原报价单号字段（当是执行订单时是原框架合同号）拷贝的时候，判断哪些物料是框架内的，给予不同颜色区分
	vue.$data.frameItems = []
	let config = {
		method: 'get',
		url: '/rest/data/v2/query?q=select customItem20__c from productOption where orderOwner__c=' + customItem272,
		contentType: 'application/json'
	}
	lapp.connection.invoke(config).then(function (res) {
		if (res.data.code == 200) {
			if (res.data.result) {
				if (res.data.result.records && res.data.result.records.length) {
					res.data.result.records.forEach(item => {
						vue.$data.frameItems.push(item.customItem20__c)
					})
				}
			}
		} else {
			vue.$message.error(res.data.msg)
		}
	})
}
var distFrameOr = function () {
	vue.$data.bomEnable = true;
	//判断是否框架合同
	//非框架合同：售前：目标额度输入框启用 ，折后价输入框禁用 。售后：取反
	//框架合同： 类型是 合同 此时折后价可以输入。当类型是订单的，折后价只有非框架产品可以输入。框架产品不允许调整折后价（此时的折后价是框架合同模板中的价格）。
	//	vue.$data.bomEnabled
	let config = {
		method: 'get',
		url: "/rest/data/v2/query?q=select id,customItem215__c,customItem233__c from _order where id=" + vue.$data.orderId + " and customItem233__c=1",
		contentType: 'application/json'
	};
	// lapp.connection.invoke(config).then(function(res1){
	// 	if(res1.data && res1.data.code==200){
	// 		if(res1.data.result && res1.data.result.records && res1.data.result.records.length){
	//         	 //框架合同
	// 			 vue.$data.bomEnable=true
	// 			 //合同/订单
	// 			// let rconfig = {
	// 			// 	method: 'get',
	// 			// 	url: "/rest/data/v2/query?q=select id from _order where id="+vue.$data.orderId,
	// 			// 	contentType:'application/json'
	// 			// };
	// 			//  lapp.connection.invoke(rconfig).then(function(res2) {
	// 			// 	 if (res2.data && res2.data.code == 200) {
	// 			// 		 if (res2.data.result && res2.data.result.records && res2.data.result.records.length) {//合同
	// 			// 			 vue.$data.discountAble=false
	// 			// 		 }else{  //订单
	// 			// 			 if(vue.$data.inFramework==true){
	// 			// 				 vue.$data.discountAble=true
	// 			// 			 }else{
	// 			// 				 vue.$data.discountAble=false
	// 			// 			 }
	// 			// 			 //是否框架内产品
	// 			// 			 //框架内产品不能编辑 折后价
	// 			// 			 //不是框架内产品 可以编辑 折后价
	// 			// 		 }
	// 			// 	 }
	// 			//  })
	// 		}else{
	// 			//非框架合同
	// 			if(vue.$data.userType==true){ //售前
	// 				vue.$data.bomEnable=false
	// 			}else{   //售后
	// 				vue.$data.bomEnable=true
	// 			}
	// 			vue.$data.discountAble=!vue.$data.bomEnable
	// 		}
	// 	}
	// })
}
var distStage = function () {

	vue.$data.configInputAble = true;
	vue.$data.discountInputAble = true;
	//判断报价阶段
	// let config = {
	// 	method: 'get',
	// 	url: "/rest/data/v2/query?q=select id,customItem226__c,approvalStatus from _order where id="+vue.$data.orderId,
	// 	contentType:'application/json'
	// };
	// lapp.connection.invoke(config).then(function(res){
	// 	if(res.data.code==200){
	// 		if(res.data.result && res.data.result.records.length){
	// 			let a=res.data.result.records[0]
	// 			//报价阶段  customItem226__c：
	// 			// 1  创建报价
	// 			// 2  评审通过
	// 			// 3  报价通过
	// 			// 4  变更审批通过
	// 			// 5   合同创建
	// 			// 6   合同审批通过
	// 			// 7   订单创建
	// 			// 9   可以变更
	// 			//审批阶段  approvalStatus:
	// 			// 0 待提交
	// 			// 1 审批中
	// 			// 2 审批拒绝
	// 			// 3 审批通过
	// 			// 4 撤回
	// 			switch (a.customItem226__c) {
	// 				case 1:// 创建报价
	// 					switch (a.approvalStatus) {
	// 						case 0://待提交
	// 						case 2://审批拒绝
	// 						case 4://撤回
	// 							vue.$data.configInputAble=true;
	// 							vue.$data.discountInputAble=true;
	// 						break;
	// 						case 1://审批中
	// 						case 3://审批通过
	// 							vue.$data.configInputAble=false;
	// 							vue.$data.discountInputAble=false;
	// 							break;
	// 					}
	// 					break;
	// 				case 2://评审通过
	// 					switch (a.approvalStatus) {
	// 						case 1://审批中
	// 							vue.$data.configInputAble=false;
	// 							vue.$data.discountInputAble=false;
	// 							break;
	// 						case 2://审批拒绝
	// 						case 3://审批通过
	// 						case 4://撤回
	// 							vue.$data.configInputAble=false;
	// 							vue.$data.discountInputAble=true;
	// 							break;
	// 					}
	// 					break;
	// 				case 3://报价通过
	// 					vue.$data.configInputAble=false;
	// 					vue.$data.discountInputAble=false;
	// 					break;
	// 				case 5://合同创建
	// 					switch (a.approvalStatus) {
	// 						case 0://待提交
	// 						case 2://审批拒绝
	// 						case 4://撤回
	// 							vue.$data.configInputAble=true;
	// 							vue.$data.discountInputAble=true;
	// 						break;
	// 						case 1://审批中
	// 						case 3://审批通过
	// 							vue.$data.configInputAble=false;
	// 							vue.$data.discountInputAble=false;
	// 							break;
	// 					}
	// 					break;
	// 				case 6://合同审批通过
	// 					vue.$data.configInputAble=false;
	// 					vue.$data.discountInputAble=false;
	// 					break;
	// 				case 7://订单创建
	// 					switch (a.approvalStatus) {
	// 						case 0://待提交
	// 						case 2://审批拒绝
	// 						case 4://撤回
	// 							vue.$data.configInputAble=true;
	// 							vue.$data.discountInputAble=true;
	// 							break;
	// 						case 1://审批中
	// 						case 3://审批通过
	// 							vue.$data.configInputAble=false;
	// 							vue.$data.discountInputAble=false;
	// 							break;
	// 					}
	// 					break;
	// 				case 9://可以变更
	// 					switch (a.approvalStatus) {
	// 						case 0://待提交
	// 						case 2://审批拒绝
	// 						case 3://审批通过
	// 						case 4://撤回
	// 							vue.$data.configInputAble=true;
	// 							vue.$data.discountInputAble=true;
	// 							break;
	// 						case 1://审批中
	// 							vue.$data.configInputAble=false;
	// 							vue.$data.discountInputAble=false;
	// 							break;
	// 					}
	// 					break;
	// 				case 4://变更审批通过
	// 					vue.$data.configInputAble=false;
	// 					vue.$data.discountInputAble=false;
	// 					break;
	// 			}

	// 		}
	// 	}else{
	// 		vue.$message.warning(res.data.msg)
	// 	}
	// }).catch(err=>{
	// 	console.log(err)
	// })
}
var showLoading = function () {
	vue.$data.loading = true;
}

var hideLoading = function () {
	vue.$data.loading = false;
}
/**
 * 根据cofnigId参数查询配置配型
 * 当存在configId时说明该界面是从修改、复制按钮跳转打开的
 */
var queryconfigTypes = function () {
	//如果是复制、编辑  configTypeId
	let configTypeId = '';
	if (getQueryString('configId')) {
		configTypeId = vue.$data.configTypeId
	} else {
		let configTypeParam = getQueryString("configType");
		console.log('[queryconfigTypes] configType param:', configTypeParam);
		console.log('[queryconfigTypes] configTypes data:', vue.$data.configTypes);
		if (vue.$data.configTypes && vue.$data.configTypes.length > 0) {
			// URL参数configType传的是名称(如Tricon)，对应configTypes中的label，不是value(数字)
			let configTypeItem = vue.$data.configTypes.find(item => item.label == configTypeParam || item.value == configTypeParam);
			console.log('[queryconfigTypes] matched configTypeItem:', configTypeItem);
			configTypeId = configTypeItem ? configTypeItem.code : '';
		}
		vue.$data.configTypeId = configTypeId;
		console.log('[queryconfigTypes] resolved configTypeId:', configTypeId);
		let type = getQueryString("configType")
		if (type == 'Tricon') {
			vue.$data.series = ''
		} else if (type == 'TSxPlus') {
			vue.$data.series = 'TSx_'
		} else if (type == 'TriconCx') {
			vue.$data.series = 'CX_'
		}
	}
	if (configTypeId) {
		vue.$data.configTypeId = configTypeId;
		var config = {
			method: 'get',
			url: '/rest/data/v2/query?q=select id,name from ConfigurationType__c where id=' + configTypeId,
			contentType: 'application/json'

		};
		lapp.connection.invoke(config)
			.then(function (response) {
				if (response.data && (response.data.code === 200 || response.data.code === '200')) {
					initDisable()
					var result = response.data && response.data.result;
					if (result.count > 0) {
						queryconfigSteps().then(function (res) {
							if (res) {
								if (vue.$data.configSteps.length) {
									let a = vue.$data.configSteps[0].id
									let b = vue.$data.configSteps[1].id
									queryconfigBlocks(a).then(function (res) {
										let m1 = vue.$data.configblocks["configblock_" + vue.$data.configSteps[0].id]
										let arr1 = []
										arr1[0] = m1[0].id
										vue.loadConfigItems(arr1)
									})
								}
							}
						});//查询配置分步
						queryRefrenceRelationShip();//查询依赖关联关系
						if (vue.$data.orderId != "") {
							distStage();
							distFrameOr();
						}

					}
				}
			})
			.catch(function (error) {
				console.log(error);
				hideLoading();
			});
	} else {
		hideLoading();
	}


}
/**
 * 查询配置步骤
 */
var queryconfigSteps = function () {
	return new Promise(function (resolve, reject) {
		var typeId = vue.$data.configTypeId;
		let param = {};
		param.xoql = "select id,name,orderNum__c,stepType__c,copyAble__c from ConfigurationStep__c where configTypeId__c=" + typeId + " order by orderNum__c,id";
		param.useSimpleCode = true;
		debugger;
		var config = {
			method: 'post',
			url: '/rest/data/v2.0/query/xoql',
			contentType: 'application/x-www-form-urlencoded',
			data: param
		};
		showLoading();
		lapp.connection.invoke(config)
			.then(function (response) {
				if (response.data && response.data.code === '200') {
					var result = response.data && response.data.data;
					if (result.count > 0) {
						var records = result.records;
						if (vue.$data.defaultSteps.length) {
							setDefaultSteps(records)
						} else {
							vue.$data.configSteps = records;//设定分步集合
						}
						vue.$data.activeTab = 'tab_' + records[0].id  //设置默认展开第一个步骤
						//默认初始化每一步的 blocks 数组为空数组。后面会逐步向里面增加block
						records.forEach(function (currentValue, index, arr) {
							vue.$set(vue.configblocks, "configblock_" + currentValue.id, []);
							// vue.$data.configTypeId=currentValue.id;
						});
					}
				}
				hideLoading();
				resolve('success')
			})
			.catch(function (error) {
				hideLoading();
				vue.$message.error("查询配置步骤发生异常:" + error);
				reject(error)
			});
	})
}
var setDefaultSteps = function (records) {
	let sArr = vue.$data.defaultSteps.split(',')
	records[1].name = sArr[0]
	vue.$data.configSteps = records
	vue.$data.copyId = records[1].id
	sArr = sArr.splice(1)
	sArr.forEach(item => {
		if (item.length && (item.substring(item.length - 4) == '(远程)')) {
			vue.$data.inputValue = item.substring(0, item.length - 4)
			vue.$data.dynamicTags.push(item.substring(0, item.length - 4))
		} else {
			vue.$data.inputValue = item
			vue.$data.dynamicTags.push(item)
		}
		doCopyBlock()
	})
}
/**
 * @param {Object} configStepId 分布ID
 * 根据分布id查询该步骤下的配置区块
 */
var queryconfigBlocks = function (configStepId, flag) {
	return new Promise(function (resolve, reject) {
		if (vue.loadedStepIds.includes(configStepId)) {
			console.info("已加载步骤：" + configStepId + ",不进行二次加载");
			resolve('success')
		} else {
			let param = {};
			let realStepId = "";
			let copyStepNum = "";
			if (configStepId.indexOf("#") > -1) {//是一个拷贝出来的步骤。后面需要特殊处理
				realStepId = configStepId.split("#")[0];
				copyStepNum = configStepId.split("#")[1];
			} else {
				realStepId = configStepId;
			}
			param.xoql = "select id,name,orderNum__c,isCopyable__c,confiurationStepId__c,copyStep__c,copyStepOrder__c from ConfigurationBlock__c where confiurationStepId__c=" + realStepId + " order by orderNum__c";
			param.useSimpleCode = true;

			var config = {
				method: 'post',
				url: '/rest/data/v2.0/query/xoql',
				contentType: 'application/x-www-form-urlencoded',
				data: param
			};
			if (flag != 'true') {
				showLoading();
			}

			lapp.connection.invoke(config)
				.then(function (response) {
					if (response.data && response.data.code === '200') {
						vue.loadedStepIds.push(configStepId);//已将加载过的配置步骤
						var result = response.data && response.data.data;
						if (result.count > 0) {
							var records = result.records;
							records.forEach(function (block) {
								if (copyStepNum != '') {
									block.id = block.id + "_" + copyStepNum;//将拷贝步骤下的所有区块都加上序号，方便后面查询区块配置项时和源区块不混淆
									vue.$set(vue.configForms, "configform_" + block.id + "_" + copyStepNum, {});//初始化一个每一个配置区块对应的form
								} else {
									vue.$set(vue.configForms, "configform_" + block.id, {});//初始化一个每一个配置区块对应的form
								}
								block.colLoading = false
							});
							vue.$set(vue.configblocks, "configblock_" + configStepId, records);//将查询到的某一step下的blocks放入到数据存储data中
						}
						resolve('success')
					} else {
						resolve('false')
					}
					hideLoading();
				})
				.catch(function (error) {
					hideLoading();
					reject(error)
					vue.$message.error("查询配置区块发生异常:" + error);
				});
		}

	})
}
/**
 * @param {Object} srcBlockId
 * 根据配置区块ID查询该配置区块下的所有配置项
 * 如果发现区块Id是带有下划线 类似于 xxxxxxx_1、xxxxxxx_2 这种说明是前端页面复制了xxxxxx区块。要进行特殊处理
 */
var queryConfigItems = function (srcBlockId, flag) {
	if (flag != 'true') {
		showLoading();
	}
	return new Promise(function (resolve, reject) {
		var copyBlockNum = "";
		var blockId = null;
		if (srcBlockId.indexOf("_") > 0) {
			//说明该区块是一个拷贝区块。要做特殊处理
			blockId = srcBlockId.split("_")[0];
			copyBlockNum = srcBlockId.split("_")[1];
		} else {
			blockId = srcBlockId;
		}
		//此处更换成新接口 对性能有所提升
		debugger;
		let url = '/rest/data/v2.0/scripts/api/neocrm/bom/query/item/list/new?blockId=' + blockId;
		if (vue.$data.preParam != "") {
			url = url + "&preParam=" + encodeURIComponent(vue.$data.preParam);
		}
		if (vue.$data.configId && vue.$data.configId != null && vue.$data.configId != "") {
			url = url + "&configId=" + vue.$data.configId;
		}
		if (vue.$data.orderId != "") {
			url = url + "&orderId=" + vue.$data.orderId;
		}
		if (copyBlockNum != "") {
			url = url + "&remoteIndex=" + copyBlockNum;
		}
		var config = {
			method: 'get',
			url: url,
			contentType: 'application/json'

		};
		lapp.connection.invoke(config)
			.then(function (response) {
				if (response.data && response.status === 200) {
					var records = response.data.items;
					var refrenceItems = [];
					if (records && records.length > 0) {
						records.forEach(function (record, index) {
							if (copyBlockNum != "") {
								record.name = record.name + "#" + copyBlockNum;
								record.id = record.id + "#" + copyBlockNum;
								record.confiurationBlockId__c = srcBlockId;
								if (record.refrenceItem__c) {
									//针对复制出来的配置步骤并且有依赖项的配置项进行特殊处理。
									//两种情况：
									//1、依赖项和和被依赖项是同一个区块下的内容
									//2、依赖项和被依赖项不是同一个区块下的内容
									//case1 :同一区块下
									if (srcBlockId.indexOf(record.refrenceItemBlock__c) > -1) {
										//将被依赖项区块强制切换为当前区块配置项所属
										record.refrenceItemBlock__c = srcBlockId;
										//加入所属依赖项的依赖列表//
										if (vue.$data.refrenceMap.hasOwnProperty(record.refrenceItem__c + "#" + copyBlockNum)) {
											let itemArray = vue.$data.refrenceMap[record.refrenceItem__c + "#" + copyBlockNum];
											record['refrenceItem__c'] = record.refrenceItem__c + "#" + copyBlockNum
											itemArray.push(record);
										} else {
											let itemArray = [];
											record['refrenceItem__c'] = record.refrenceItem__c + "#" + copyBlockNum;
											itemArray.push(record);
											vue.$data.refrenceMap[record.refrenceItem__c] = itemArray;
										}
									}
									//case2：不同区块下
									else {
										if (vue.$data.refrenceMap.hasOwnProperty(record.refrenceItem__c)) {
											let itemArray = vue.$data.refrenceMap[record.refrenceItem__c];
											itemArray.push(record);
										} else {
											let itemArray = [];
											itemArray.push(record);
											vue.$data.refrenceMap[record.refrenceItem__c] = itemArray;
										}

									}
								}
							}
							let valueKey = "itemValue::" + srcBlockId + "::" + record.id;
							vue.$set(vue.$data.itemApiKeys, record.name, valueKey);
							vue.$set(vue.$data.configItemRecords, record.name, record);
							//根据组件类型分别设置默认值
							if (!vue.$data.itemValues.hasOwnProperty(valueKey)) {
								if (record.componmentType__c == '4') {
									vue.$set(vue.$data.itemValues, valueKey, false);
								} else if (record.componmentType__c == '3') {
									vue.$set(vue.$data.itemValues, valueKey, 0);
								} else if (record.componmentType__c == '5' && (record.multiSelect__c == '0')) {
									vue.$set(vue.$data.itemValues, valueKey, "");
								} else if (record.componmentType__c == '5' && (record.multiSelect__c == '1')) {
									vue.$set(vue.$data.itemValues, valueKey, []);
								} else if (record.componmentType__c == '8') {
									vue.$set(vue.$data.itemValues, valueKey, []);
								} else if (record.componmentType__c == '9') {
									vue.$set(vue.$data.itemValues, valueKey, []);
								}
								else {
									if (record.componmentType__c !== '6' && record.componmentType__c !== '7') {
										vue.$set(vue.$data.itemValues, valueKey, "");
									}
								}


							}
							//下拉选择框和级联选择框需要查询备选数据源
							//并记录下这个item 所关联到的其他配置项
							if (record.componmentType__c == '5' || record.componmentType__c == '8') {
								vue.$data.srcBlockId = srcBlockId;
								if (record.initDataSource__c) {//如果有则说明是第一层级的下拉框直接设置
									let dataSource = JSON.parse(record.initDataSource__c);
									record.initDataSource__c = dataSource;
									vue.$set(vue.$data.selectItemDataSource, "configItemDataSource_" + srcBlockId + "_" + record.id, dataSource.dataSource);
									vue.$set(vue.$data.selectItemDataSourceNew, "configItemDataSource_" + srcBlockId + "_" + record.id, dataSource.dataSource);
									if (record.componmentType__c == '5') {
										if (record.initDataSource__c.defaultValue) {
											//如果数据源中有首选项就更新当前控件的选中值
											vue.$set(vue.$data.itemValues, valueKey, record.initDataSource__c.defaultValue);
										} else if (record.primaryProductCode__c) {
											vue.$set(vue.$data.itemValues, valueKey, record.primaryProductCode__c);
										} else if (record.defaultValue__c) {
											vue.$set(vue.$data.itemValues, valueKey, record.defaultValue__c);
										}
									}
								}
								else if (record.customizeDataSource__c != null && record.customizeDataSource__c != undefined && record.customizeDataSource__c != '') {
									//是自定义数据源的则拆分解析出自定义数据源
									setCustomizeDataSource(record.customizeDataSource__c, srcBlockId, record.id, record.isCasecade__c, record.multiSelect__c, record.defaultValue__c);
								}
								else if (record.refrenceItem__c) {
									//有依赖项的要对依赖项数据源进行加载
									refrenceItems.push(record);
								}
							}
						});
						initDefaultQuantity()//这个东西不能加在这 会导致每次加载一个新的区块就把前面已经配置过的数值给修改成默认值
						setDefaultQuantity();//设置一些配置项的默认值
						setDefaultDisable();
						//开始处理有依赖项的下拉框的数据源
						let refrenceItemMap = {};
						//对依赖项按照URL分组，这样能够做到同一个请求只需要请求一次
						refrenceItems.forEach(function (record, index, array) {
							let refrenceValueKey = "itemValue::" + record.refrenceItemBlock__c + "::" + record.refrenceItem__c;
							let code = vue.$data.itemValues[refrenceValueKey];
							if (record.workflowStageName) {//将依赖项当前保存在数据库的值设置为查询条件
								code = record.workflowStageName;//借用了workflowStageName这个字段
							}
							// if(code==undefined||code==''){
							// 	if(record.workflowStageName){//将依赖项当前保存在数据库的值设置为查询条件
							// 		code=record.workflowStageName;//借用了workflowStageName这个字段
							// 	}
							// }
							if (code) {
								let url = "/rest/data/v2.0/scripts/api/neocrm/bom/query/item/reference?referenceCode=" + encodeURIComponent(code) + "&userId=" + getQueryString("userId");
								if (record.dataSourceUrl__c) {
									url += "&param=" + record.dataSourceUrl__c;
									url = urlLocalParamProcess(url);//针对配置中包含了#xxxx#的配置参数进行替换处理
								}
								if (refrenceItemMap.hasOwnProperty(url)) {
									refrenceItemMap[url].push(record);
								} else {
									refrenceItemMap[url] = new Array(record);
								}
							}
						});
						//根据urlmap 批量查询更新依赖项的数据源
						let interval = 1;//用于做延时加载
						let count = 1;
						for (let key in refrenceItemMap) {
							//每10个让间隔增加1避免出现高频访问接口
							if (count % 10 == 0) {
								interval = interval + 1;
							}
							setTimeout(function () {
								var config = {
									method: 'get',
									url: key,
									contentType: 'application/json'
								};
								lapp.connection.invoke(config).then(function (response) {

									if (response.data && response.data.dataSource) {
										let itemArray = refrenceItemMap[key];
										itemArray.forEach(function (record) {
											let valueKey = "itemValue::" + srcBlockId + "::" + record.id;
											vue.$set(vue.$data.selectItemDataSource, "configItemDataSource_" + srcBlockId + "_" + record.id, response.data.dataSource);
											vue.$set(vue.$data.selectItemDataSourceNew, "configItemDataSource_" + srcBlockId + "_" + record.id, response.data.dataSource);
											if (getItemValue(record.name) == null || getItemValue(record.name) == "") {//加入该判断的目的是防止已经设置过历史状态数据后又被数据源中的默认值给代替
												if (response.data.defaultValue) {
													//如果数据源中有首选项就更新当前控件的选中值
													vue.$set(vue.$data.itemValues, valueKey, response.data.defaultValue);
												} else {
													vue.$set(vue.$data.itemValues, valueKey, record.primaryProductCode__c);
												}
											}

										});

									}
								});
							}, interval * 1);
							count = count + 1;
						}
						//为了方便展现，以分割符为界点将数组分割为多段
						var itemsArray = [];
						var oneItemInGroup = new Array(1);
						for (let i = 0; i < records.length; i++) {
							let info = records[i]
							if (info["componmentType__c"] == '7' || info["componmentType__c"] == '8' || info["componmentType__c"] == '9') {
								oneItemInGroup[0] = info;
								itemsArray.push(oneItemInGroup);
								oneItemInGroup = new Array(1);
							}
							else {
								if (i === 0 || !Array.isArray(itemsArray[itemsArray.length - 1])) {
									let splitArr = []
									splitArr.push(info)
									itemsArray.push(splitArr)
								}
								else {
									itemsArray[itemsArray.length - 1].push(info)
								}
							}
						}
						vue.$set(vue.$data.configItems, "configitem_" + srcBlockId, itemsArray);
						setTimeout(() => {
							setCopyOrEditDefault(records)//复制或编辑时设置选项值
						}, 400)
					} else {
						vue.$set(vue.$data.configItems, "configitem_" + srcBlockId, itemsArray);

					}
					resolve('success')
				} else {
					reject('false')
				}
				// hideLoading();
			})
			.catch(function (error) {
				hideLoading();
				vue.$message.error("查询配置项发生异常:" + error);
				reject('false')
			});
	})
}
/**
 * 设置配置项的数据库中的当前值
 * @param records
 */
var setCopyOrEditDefault = function (records) {
	let operate = getQueryString('operateType');
	let copyNumOr = getQueryString('copyNumOr')
	if (vue.$data.defaultItems.length && (vue.$data.defaultItems.length > 0)) {
		showLoading();
		records.forEach(item0 => {
			vue.$data.defaultItems.forEach(item => {
				if (item0.name == item.name) {

					if (operate == 'edit' || (operate == 'copy' && copyNumOr == 'true')) {
						vue.$set(vue.$data.editConfigItemsId, item.name, item.id);
					}
					if (item.itemType__c == 8) {
						if (item.spares && item.spares.length > 0) {
							let a = []
							item.spares.forEach(t => {
								a.push(t.productCode__c)
								if (operate == 'edit' || (operate == 'copy' && copyNumOr == 'true')) {
									if (t.itemQuantity__c != undefined && t.itemQuantity__c > 0) {
										vue.$data.sparesQuantity[t.name + '_' + t.productCode__c] = t.itemQuantity__c
									}
								}
							})
							setItemValue(item.name, a)
						}
					}
					else if (item.itemType__c == 9) {
						let r = item.thirdPartsProducts
						if (operate == 'copy' && copyNumOr != 'true') {
							r.forEach(i => {
								i.quantity__c = 0
							})
						}
						setItemValue(item.name, r)
					}
					else {
						if (item.itemType__c == 5 || ((operate == 'edit' || (operate == 'copy' && copyNumOr == 'true')) && item.itemType__c != 4)) {
							setItemValue(item.name, item.itemValue__c)
						}
						if (item.itemType__c == 4) {
							let booleanA = JSON.parse(item.itemValue__c)
							setItemValue(item.name, booleanA)
						}
					}
					//编辑赋quantity，复制不赋值quantity
					if (operate == 'edit' || (operate == 'copy' && copyNumOr == 'true')) {
						if (item.itemType__c == 5 && item.itemQuantity__c != undefined && item.itemQuantity__c > 0) {
							setItemQuantity(item.name, item.itemQuantity__c)
						}
					}
				}

			});
		})
	}
	hideLoading();
}
/**
 * 可拷贝区块增加拷贝时处理拷贝区块内容和对应的配置步骤的增加。
 * @param block
 */
var doCopyBlock = function (remoteFlag) {
	vue.$data.addNum += 1;
	vue.$data.copyItem = {}

	let a = 0
	vue.$data.configSteps.forEach((item, index) => {
		if (item.id == vue.$data.copyId) {
			a = index
			for (let key in item) {
				if (key == 'id') {
					vue.$data.copyItem[key] = item.id + '#' + vue.$data.addNum
				} else if (key == 'copyAble__c') {
					vue.$data.copyItem['copyAble__c'] = ''
				} else if (key == 'name') {
					vue.$data.copyItem[key] = vue.$data.inputValue + '(远程)'
				} else {
					vue.$data.copyItem[key] = item[key]
				}
			}
			vue.$data.copyItem.isCopy = true
		}
	})

	vue.$data.copyBlocks.push(vue.$data.copyItem)
	let n = 0
	if (vue.$data.copyBlocks.length) {
		n = vue.$data.copyBlocks.length
	}
	vue.$data.configSteps.splice(a + n, 0, vue.$data.copyItem)
	vue.$set(vue.configblocks, "configblock_" + vue.$data.copyItem['id'], []);
	addDisAbles(vue.$data.addNum)

	local_calc(remoteFlag)
	remoteStepCopyProcess();
}
/**复制/删除区块时， 批量 添加/移除 区块禁用项
 * @param n
 */
var addDisAbles = function (n) {
	let disArr = ['DI_Module', 'DI_ETP', 'DI_ETP2', 'DO_Module', 'DO_ETP', 'DO_ETP2',
		'AI_Module', 'AI_ETP', 'AI_ETP2', 'AO_Module', 'AO_ETP', 'AO_ETP2', 'PI_Module', 'PI_ETP']
	disArr.forEach(item => {
		vue.$data.disables.push(vue.$data.series + 'Remote' + item + '#' + n)
	})
	if (vue.$data.series == '') {
		vue.$data.seDisables.push('RemoteAO_Module2#' + n, 'RemoteAO_ETP2#' + n)
	} else if (vue.$data.series == 'CX_') {
		let fets = ['DI_FET', 'DI_FET2', 'DO_FET', 'DO_FET2', 'AI_FET', 'AI_FET2', 'AO_FET', 'AO_FET2', 'PI_FET', 'UIO_FET', 'UIO_FET2', 'UIO_Module',
			'UIO_ETP', 'UIO_ETP2', 'IOBus_RJ45Cable', 'IOBus_IMSSRemote', 'ExChassis_CMJumper', 'IO_Cable', 'IOBus_SFP']
		fets.forEach(item => {
			vue.$data.disables.push(vue.$data.series + 'Remote' + item + '#' + n)
		})
		vue.$data.disables.push(vue.$data.series + 'ExChassis_CMJumper#' + n)
		vue.$data.disables.push(vue.$data.series + 'IOBus_IMSSRemote#' + n)
	} else if (vue.$data.series == 'TSx_') {
		vue.$data.disables.push(vue.$data.series + 'RemotePI_ETP2#' + n)
		vue.$data.disables.push(vue.$data.series + 'RemoteIOBus_IM#' + n)
		vue.$data.disables.push(vue.$data.series + 'RemoteIOBus_MFCM#' + n)
		vue.$data.disables.push(vue.$data.series + 'RemoteIOBus_FJumper#' + n)
		vue.$data.disables.push(vue.$data.series + 'RemoteIO_Cable#' + n)
		vue.$data.disables.push(vue.$data.series + 'RemoteOSP_ETP#' + n)
		vue.$data.disables.push(vue.$data.series + 'RemoteVM_Module#' + n)
		vue.$data.disables.push(vue.$data.series + 'RemoteVM_ETP#' + n)
		vue.$data.disables.push(vue.$data.series + 'RemoteSM_ETP#' + n)
		vue.$data.disables.push(vue.$data.series + 'RemoteSM_Module#' + n)
	}
}

/**
 * 根据主产品ID查询产品包信息
 * @param {String} mainProductId - 主产品ID（productPackage__c的外键mainProduct__c）
 * @returns {Promise} 返回查询到的records数组
 */
var queryProductPackage = function (mainProductId) {
	return new Promise(function (resolve, reject) {
		if (!mainProductId) {
			resolve([]);
			return;
		}
		let param = {};
		param.xoql = "select id,name,quantity__c from productPackage__c where mainProduct__c=" + mainProductId;
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
var minusDisAbles = function (n) {
	vue.$data.seDisables.forEach((item, index) => {
		if (item.length && (Number(item.substring(item.length - 1)) == n)) {
			vue.$data.seDisables.splice(index, 1)
		}
	})
	vue.$data.disables.forEach((item, index) => {
		if (item.length && (Number(item.substring(item.length - 1)) == n)) {
			vue.$data.disables.splice(index, 1)
		}
	})
}
/**
 * 当远端进行拷贝时处理一些初始化动作
 */
var remoteStepCopyProcess = function () {
	defaultQuantityArray.push({ item: vue.$data.series + "Slave_CMRemote#" + vue.$data.addNum, defaultQuantity: 0 });
	defaultQuantityArray.push({ item: vue.$data.series + "Salve_RemoteChassis#" + vue.$data.addNum, defaultQuantity: 0 });
	defaultQuantityArray.push({ item: vue.$data.series + "RemoteEx_Chassis#" + vue.$data.addNum, defaultQuantity: 0 });
	defaultDisableArray.push(vue.$data.series + "Slave_CMRemote#" + vue.$data.addNum);

	defaultDisableArray.push(vue.$data.series + "Salve_RemoteChassis#" + vue.$data.addNum);
	defaultDisableArray.push(vue.$data.series + "RemoteEx_Chassis#" + vue.$data.addNum);
	defaultDisableArray.push(vue.$data.series + "Salve_RemoteChassis#" + vue.$data.addNum);
	defaultDisableArray.push(vue.$data.series + "RemoteEx_Chassis#" + vue.$data.addNum);
	defaultDisableArray.push(vue.$data.series + "RemoteIObus_Cable#" + vue.$data.addNum);
	defaultDisableArray.push(vue.$data.series + "RemoteBlankSlotPanel#" + vue.$data.addNum);
	defaultDisableArray.push(vue.$data.series + "RemotePS_Module#" + vue.$data.addNum);
	defaultDisableArray.push(vue.$data.series + "RemoteELCO_Cable#" + vue.$data.addNum);
	if (vue.$data.series == 'TSx_') {
		defaultDisableArray.push(vue.$data.series + "RemoteIOBus_SFJumper#" + vue.$data.addNum);
		defaultDisableArray.push(vue.$data.series + "RemoteIOBus_SFCM#" + vue.$data.addNum);
	} else if (vue.$data.series == 'CX_') {
		defaultDisableArray.push(vue.$data.series + "RemoteBlankSlotPanel2#" + vue.$data.addNum);
		defaultDisableArray.push(vue.$data.series + "IOBus_IMFFRemote#" + vue.$data.addNum);
		defaultDisableArray.push(vue.$data.series + "IOBus_RJ45Cable#" + vue.$data.addNum);
	}
}

/**
 * 根据主产品ID查询产品包信息
 * @param {String} mainProductId - 主产品ID（productPackage__c的外键mainProduct__c）
 * @returns {Promise} 返回查询到的records数组
 */
var queryProductPackage = function (mainProductId) {
	return new Promise(function (resolve, reject) {
		if (!mainProductId) {
			resolve([]);
			return;
		}
		let param = {};
		param.xoql = "select id,name,quantity__c from productPackage__c where mainProduct__c=" + mainProductId;
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


/**
 * 自定义下拉框数据源处理
 * @param {Object} customizeDataSource
 * @param {Object} blockId
 * @param {Object} itemId
 * @param {Object} isCascade
 * @param {Object} multiSelect
 * @param {Object} defaultValue
 */
var setCustomizeDataSource = function (customizeDataSource, blockId, itemId, isCascade, multiSelect, defaultValue) {
	let dataSource = [];
	let dataSourceArray = customizeDataSource.split(";");
	dataSourceArray.forEach(function (arr) {
		let a = arr.split("=");
		let item = {};
		item.label = a[0];
		item.value = a[1];
		dataSource.push(item);
		vue.$set(vue.$data.selectItemDataSource, "configItemDataSource_" + blockId + "_" + itemId, dataSource)
		vue.$set(vue.$data.selectItemDataSourceNew, "configItemDataSource_" + blockId + "_" + itemId, dataSource)
		let valueKey = "itemValue::" + blockId + "::" + itemId;
		if (defaultValue) {
			if ((defaultValue.indexOf("#") == 0) && (defaultValue.lastIndexOf("#") == (defaultValue.length - 1))) {
				let paramKey = defaultValue.substring(1, defaultValue.length - 1);
				paramKey = vue.$data.itemApiKeys[paramKey];
				defaultValue = vue.$data.itemValues[paramKey];
				vue.$set(vue.$data.itemValues, valueKey, defaultValue);
			} else {
				vue.$set(vue.$data.itemValues, valueKey, defaultValue);
			}
		}
	});
}
/**
 * @param {Object} url
 * @param {Object} itemId
 * @param {Object} isCascade
 *
 * 查询下拉框（级联选择下拉框)的数据源
 * +"?itemId="+itemId
 */
var queryDataSource = function (url, blockId, itemId, isCascade, multiSelect, componmentType, defaultValue) {
	return new Promise((resolve, reject) => {
		let urlMap = {};//等待返回
		url = urlLocalParamProcess(url);
		if (vue.$data.orderId != "") {
			url = url + "&orderId=" + vue.$data.orderId;
		}
		url = url.replace("https://api-p05.xiaoshouyi.com", "");
		var config = {
			method: 'get',
			url: url,
			contentType: 'application/json'

		}
		lapp.connection.invoke(config)
			.then(function (response) {
				if (response.data && response.status === 200) {
					if (componmentType == '8') {
						//穿梭框的特殊处理一下
						vue.$set(vue.$data.selectItemDataSource, "configItemDataSource_" + blockId + "_" + itemId, response.data.dataSource)
						vue.$set(vue.$data.selectItemDataSourceNew, "configItemDataSource_" + blockId + "_" + itemId, response.data.dataSource)
						return;
					}
					vue.$set(vue.$data.selectItemDataSource, "configItemDataSource_" + blockId + "_" + itemId, response.data.dataSource)
					vue.$set(vue.$data.selectItemDataSourceNew, "configItemDataSource_" + blockId + "_" + itemId, response.data.dataSource)
					let valueKey = "itemValue::" + blockId + "::" + itemId;
					//如果组件上配置的首选物料则优先使用组件的首选物料，否则使用查询出来的数据源中首选物料
					if (response.data.defaultValue) {
						urlMap = getRefrenceItemsInUrlMap({ "id": itemId }, response.data.defaultValue);
						vue.$set(vue.$data.itemValues, valueKey, response.data.defaultValue);
					} else if (defaultValue) {
						vue.$set(vue.$data.itemValues, valueKey, defaultValue);
						urlMap = getRefrenceItemsInUrlMap({ "id": itemId }, defaultValue);
					} else {
						//如果数据源中没有默认值，也没有传入默认值,设置为初始状态
						vue.$set(vue.$data.itemValues, valueKey, "");
					}
				}
				resolve(urlMap);
			}).catch(function (e) {
				console.error("----------首层加载异常-------" + url);
				if (e.message.indexOf("429") > -1) {
					setTimeout(function () {
						console.info("----------首层加载异常-------" + url + "重新尝试加载");
						queryDataSource(url, blockId, itemId, isCascade, multiSelect, componmentType, defaultValue);
					}, 2000);
				}

			});
	});
}

/**
 * @param {Object} val
 * @param {Object} flag
 * DI卡件的计算逻辑
 */
var isNumber = function (val) {
	let regPos = /^\d+(\.\d+)?$/; //非负浮点数
	if (regPos.test(val)) {
		return true;
	} else {
		return false;
	}
}

/**
 * 根据主产品ID查询产品包信息
 * @param {String} mainProductId - 主产品ID（productPackage__c的外键mainProduct__c）
 * @returns {Promise} 返回查询到的records数组
 */
var queryProductPackage = function (mainProductId) {
	return new Promise(function (resolve, reject) {
		if (!mainProductId) {
			resolve([]);
			return;
		}
		let param = {};
		param.xoql = "select id,name,quantity__c from productPackage__c where mainProduct__c=" + mainProductId;
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

var testParams = function (arr, s, l) {  // numCalc('DIPoints',{m:'DI_Module',e:['DI_ETP','DI_ETP1']},{m:'DI_Module2',e:['DI_ETP2']})
	for (let i in arr) {
		if (typeof arr[i] === 'string') {
			arr[i] = vue.$data.series + s + arr[i] + l
		} else if (Object.prototype.toString.call(arr[i]) == '[object Array]') {
			testParams(arr[i], s, l)
		} else if (Object.prototype.toString.call(arr[i]) == '[object Object]') {
			testParams(arr[i], s, l)
		}
	}
	return arr
}
var addOther = function () { //ADD_Enable  {m:this.series+s+'DI_Module'+l,e:[this.series+s+'DI_ETP'+l,this.series+s+'DI_ETP1'+l]},{m:this.series+s+'DI_Module2'+l,e:[this.series+s+'DI_ETP2'+l]}
	let params = []
	for (let i = 0; i < arguments.length; i++) {
		params.push(arguments[i])
	}
	let addVal = getItemValue(params[0]) || 0
	let XIPoints = getItemValue(params[2]) || 0
	if (params[1].indexOf('AI_Module') == -1) {
		XIPoints = getItemValue(params[3]) || 0
	}
	let pointBuff = getItemValue(vue.$data.series + "pointBuff");//点数备用量
	if (pointBuff > 0) {
		XIPoints = Math.ceil(XIPoints * (1 + pointBuff / 100));//I实际计算点数
	}
	let product = getItemInfo(params[1]);
	if (!product.slotCount__c) {
		setError(params[1], '未获取到点槽位数')
		setItemQuantity(params[1], undefined)
		return false;
	} else {
		setError(params[1], '')
	}
	let module1Points = product.slotCount__c;
	let module2Quantity = 0
	if (params[1].indexOf('AI_Module') == -1) {
		module2Quantity = getItemQuantity(params[2])
	}
	let module1Quantity = Math.ceil(XIPoints / module1Points) - module2Quantity;
	let a = module1Quantity + addVal
	setItemQuantity(params[1], a)
}
var numCalc = function () {   //第二个参数和第三个参数,第四个参数，需要清空etp1的件数时，最后一个参数传2，否则不传。 {m:'DI_Module',e:['DI_ETP','DI_ETP1']},{m:'DI_Module2',e:['DI_ETP2']},'hasTcValue'
	let params = []  //实参
	for (let i = 0; i < arguments.length; i++) {
		params.push(arguments[i])
	}
	let s = ''  //是否远程  ‘Remote'
	let l = ''   //是否复制模块 ’#1.....'
	let DIPointsStr = 'DIPoints'
	let AIPointsStr = 'AIPoints'
	let PIPointsStr = 'PIPoints'
	let series = ''   //配置类型  ‘TSx_.....'
	let reg = /^TSx_.*/g
	let regCx = /^CX_.*/g
	if (reg.test(params[0])) {
		series = 'TSx_'
	} else if (regCx.test(params[0])) {
		series = 'CX_'
	}
	if (series != '') {
		DIPointsStr = series + 'DI_Points'
		AIPointsStr = series + 'AI_Points'
		PIPointsStr = series + 'PI_Points'
	}
	if (params[0].indexOf('Remote') != -1) {
		s = 'Remote'
		if (params[0].indexOf('#') != -1 && isNumber(params[0].substring(params[0].length - 1))) {
			l = params[0].substring(params[0].length - 2)   //#1...2..3..
		}
		DIPointsStr = series + s + 'DI_Points' + l
		AIPointsStr = series + s + 'AI_Points' + l
		PIPointsStr = series + s + 'PI_Points' + l
	}
	let pointBuff = 0
	if (params[0] == 'TSx_' + s + 'VM_Points' + l) {
		pointBuff = getItemValue('TSx_' + s + 'VM_PointBuff' + l);
	} else if (params[0] == 'TSx_' + s + 'SM_Points' + l) {
		pointBuff = getItemValue('TSx_' + s + 'SM_PointBuff' + l);
	} else if (params[0].indexOf('UIO_Points') != -1) {
		pointBuff = getItemValue(series + s + 'UIO_DO_Points' + l);
	} else {
		pointBuff = getItemValue(series + "pointBuff");//点数备用量
	}
	if (pointBuff == undefined) {
		pointBuff = 0
	}
	let XIPoints = getItemValue(params[0]);//第一列点数
	let XI_Card_Quantity = getItemQuantity(params[1].m);  //I卡1件数
	let XI_Module_value = getItemValue(params[1].m);
	if (pointBuff > 0) {
		XIPoints = Math.ceil(XIPoints * (1 + pointBuff / 100));//I实际计算点数
	}
	//设置module,etp 的件数
	let addQuantity = 0
	let addFlag = getItemValue(series + s + 'ADD_Enable' + l)
	if (addFlag == true) {
		if (params[0] == AIPointsStr) {
			addQuantity = getItemValue(series + s + 'AI_ModuleADD' + l)
		} else if (params[0] == DIPointsStr) {
			addQuantity = getItemValue(series + s + 'DI_ModuleADD' + l)
		} else if (params[0] == PIPointsStr) {
			addQuantity = getItemValue(series + s + 'PI_ModuleADD' + l)
		}
	}
	queryProductInfo(params[1].m).then(function (res) {
		if (!res.slotCount__c) {
			setError(params[1].m, '未获取到点槽位数')
			setItemQuantity(params[1].m, undefined)
			return false;
		} else {
			setError(params[1].m, '')
		}
		let product = res;
		let XI_Module_productPoints = product.slotCount__c;
		XI_Card_Quantity = Math.ceil(XIPoints / XI_Module_productPoints);
		setItemQuantity(params[1].m, XI_Card_Quantity + addQuantity);
		let nIndex = 0
		if (params[0].indexOf('Remote') != -1) {
			if (params[0].indexOf('#') != -1 && isNumber(params[0].substring(params[0].length - 1))) {
				nIndex = Number(params[0].substring(params[0].length - 1))
			}
		}
		if (series == 'CX_') {   //设置FET
			let fetS = params[1].m.split('_')[1]
			let fet = 'CX_' + fetS + '_FET'
			let fet2 = 'CX_' + fetS + '_FET2'
			if (nIndex > 0) {
				fet = 'CX_' + fetS + '_FET#' + nIndex
				fet2 = 'CX_' + fetS + '_FET2#' + nIndex
			}
			setItemQuantity(fet, XI_Card_Quantity + addQuantity)
			setItemQuantity(fet2, 0)
			if (params[0].indexOf('AI_Points') != -1) {

			} else if (params[0].indexOf('AI_TcPoints') != -1 || params[0].indexOf('AI_TC_Points') != -1) {
				setItemQuantity(fet2, XI_Card_Quantity + addQuantity)
			}
		}
		setTimeout(() => {
			let regStr = /Remote/g
			if (regStr.test(params[0])) {
				chassis_calc(nIndex)   //机架相关计算
				//	setTimeout(()=>{
				local_calc()
				//	},4)
			} else {
				local_calc()
			}
		}, 200)
		let m = params[1].e
		let XI_ETP_value = getItemValue(m[0])
		queryProductInfo(m[0]).then(function (res) {
			//重置ETP
			if (!res.slotCount__c) {
				setError(m[0], '未获取到点槽位数')
				setItemQuantity(m[0], undefined)
				//	vue.$message.warning('未获取到相关点槽位数')
				return false;
			} else {
				setError(m[0], '')
			}
			let XI_ETP_productPoints = res.slotCount__c
			let XI_ETP_Quantity = (XI_Card_Quantity + addQuantity) * XI_Module_productPoints / XI_ETP_productPoints
			setItemQuantity(m[0], XI_ETP_Quantity);
			//清空ETP1
			if (params[1].e.length > 1) {
				let p = params[1].e
				let n = p.length - 1
				setItemQuantity(p[n], 0);
			}
			elco_calc(params[0])
		})
		if (params[params.length - 1] != series + s + 'hasTCValue' + l || !getItemValue(params[params.length - 1])) {   //hasTcValue
			let a = params[2];  //module2 ETP2
			for (let key in a) {
				if (Object.prototype.toString.call(a[key]) == '[object Array]') {
					for (let i = 0; i < a[key].length; i++) {
						setItemQuantity(a[key][i], 0);
					}
				} else {
					setItemQuantity(a[key], 0);
				}
			}
		}

	});
}
var module2NumChange = function () {
	let params = []
	for (let i = 0; i < arguments.length; i++) {
		params.push(arguments[i])
	}
	let pointBuff = 0
	let s = params[0].indexOf('Remote') == -1 ? '' : 'Remote'
	let l = ''
	if (params[0].indexOf('Remote') != -1) {
		if (params[0].indexOf('#') != -1 && isNumber(params[0].substring(params[0].length - 1))) {
			l = params[0].substring(params[0].length - 2)
		}
	}
	if (params[0].indexOf('UIO_Module2') != -1) { //CX
		pointBuff = getItemValue(vue.$data.series + s + "UIO_DO_Points" + l)
	} else {
		pointBuff = getItemValue(vue.$data.series + "pointBuff")
	}
	let addQuantity = 0
	let addFlag = getItemValue(vue.$data.series + s + 'ADD_Enable' + l)
	if (params[0].indexOf('AI_Module2') != -1
		|| params[0].indexOf('DI_Module2') != -1
		|| params[0].indexOf('PI_Module2') != -1) {
		if (addFlag == true) {
			if (params[0].indexOf('AI_Module2') != -1) {
				addQuantity = getItemValue(vue.$data.series + s + 'AI_ModuleADD' + l)
			} else if (params[0].indexOf('DI_Module2') != -1) {
				addQuantity = getItemValue(vue.$data.series + s + 'DI_ModuleADD' + l)
			} else if (params[0].indexOf('PI_Module2') != -1) {
				addQuantity = getItemValue(vue.$data.series + s + 'PI_ModuleADD' + l)
			}
		}
	}
	let XIPoints = getItemValue(params[params.length - 1]);//第一列点数
	if (!XIPoints && params[0].indexOf('AI_Module2') == -1 && params[0].indexOf('DI_Module2') == -1 && params[0].indexOf('PI_Module2') == -1) {
		//	vue.$message.warning('请先填写对应点数')
		setItemQuantity(params[0], 0)
	} else {
		if (!XIPoints && !addQuantity) {
			//	vue.$message.warning('请先填写对应点数')
			setItemQuantity(params[0], 0)
			//return false
		}
		// let XI_Card_Quantity=getItemQuantity(params[1].m);  //I卡1件数
		// let XI_Module_value=getItemValue(params[1].m);
		if (pointBuff > 0) {
			XIPoints = Math.ceil(XIPoints * (1 + pointBuff / 100));//I实际计算点数
		}
		let module2_value = getItemValue(params[0])
		queryProductInfo(params[0]).then(res => {
			if (!res.slotCount__c) {
				setError(params[0], '未获取到点槽位数')
				setItemQuantity(params[0], undefined)
				//vue.$message.warning('未获取到'+module2_value+'的点槽位数')
				return false;
			} else {
				setError(params[0], '')
			}
			let product = res;
			let XI_Module2_productPoints = product.slotCount__c;
			let module2_quantity = getItemQuantity(params[0])

			//重置module1 和 ETP2
			let module1_quantity = getItemQuantity(params[2].m)
			let a = Math.ceil(XIPoints / XI_Module2_productPoints)
			//if(module2_quantity>a){
			//setItemQuantity(params[0],a)
			//	setItemQuantity(params[1],0)
			// vue.$message.warning('超出可配置最大值，最大值为'+a)
			// setItemQuantity(params[0],undefined)
			// setItemQuantity(params[1],undefined)
			//}else{
			//	if(module1_quantity){
			module2_quantity = module2_quantity > (a + addQuantity) ? (a + addQuantity) : module2_quantity
			setItemQuantity(params[0], module2_quantity)
			let total = module2_quantity * XI_Module2_productPoints
			// module2 件数*槽位点数
			let module1_value = getItemValue(params[2].m)
			queryProductInfo(params[2].m).then(res => {
				if (!res.slotCount__c) {
					vue.$message.warning('未获取到' + module1_value + '的点槽位数')
					return false;
				}
				let module1_point = res.slotCount__c
				//	(m1+m2)>=XIPoints  ==>   m2>=(XIPoints-m1)   m1>=xipoints-m2
				let m1 = module1_point * module1_quantity
				let m2 = XI_Module2_productPoints * module2_quantity
				//重置Module
				module1_quantity = Math.ceil((XIPoints - m2) / module1_point) + addQuantity
				setItemQuantity(params[2].m, module1_quantity)

				let nIndex = 0
				if (params[0].indexOf('Remote') != -1) {
					if (params[0].indexOf('#') != -1 && isNumber(params[0].substring(params[0].length - 1))) {
						nIndex = Number(params[0].substring(params[0].length - 1))
					}
				}
				if (vue.$data.series == 'CX_') {   //设置FET
					let fetS = params[2].m.split('_')[1]
					let fet = 'CX_' + fetS + '_FET'
					let fet2 = 'CX_' + fetS + '_FET2'
					if (nIndex > 0) {
						fet = 'CX_' + fetS + '_FET#' + nIndex
						fet2 = 'CX_' + fetS + '_FET2#' + nIndex
					}
					setItemQuantity(fet, module1_quantity)
					setItemQuantity(fet2, module2_quantity)
				}
				setTimeout(() => {
					let regStr = /Remote/g
					if (regStr.test(params[0])) {
						chassis_calc(nIndex)   //机架相关计算
						setTimeout(() => {
							local_calc()
						}, 4)
					} else {
						local_calc()
					}
				}, 200)

				//重置ETP
				let etp_value = getItemValue(params[2].e[0])
				let etp_quantity = getItemQuantity(params[2].e[0])
				queryProductInfo(params[2].e[0]).then(res => {
					if (!res.slotCount__c) {
						vue.$message.warning('未获取到' + etp_value + '的点槽位数')
						return false;
					}
					let module1_quantity_new = getItemQuantity(params[2].m)
					let etp_point = res.slotCount__c
					etp_quantity = Math.ceil(module1_quantity_new * module1_point / etp_point)
					setItemQuantity(params[2].e[0], etp_quantity)
				})
				//清空ETP1
				if (params[2].e.length > 1) {
					setItemQuantity(params[2].e[params[2].e.length - 1], undefined)
				}
				//重置ETP2
				let etp2_value = getItemValue(params[1])
				queryProductInfo(params[1]).then(res => {
					if (!res.slotCount__c) {
						setError(params[1], '未获取到点槽位数')
						//vue.$message.warning('未获取到'+etp2_value+'的点槽位数')
					} else {
						setError(params[1], '')
					}
					let etp2_productPoints = res.slotCount__c;
					let etp2_quantity = Math.ceil(total / etp2_productPoints)  // ETP2的件数=module2的件数*module2的槽位点数 / ETP2的槽位点数
					setItemQuantity(params[1], etp2_quantity)   //重置ETP2的件数
					elco_calc(arguments[0])
				})
			})


		})
	}
}

/**
 * 根据主产品ID查询产品包信息
 * @param {String} mainProductId - 主产品ID（productPackage__c的外键mainProduct__c）
 * @returns {Promise} 返回查询到的records数组
 */
var queryProductPackage = function (mainProductId) {
	return new Promise(function (resolve, reject) {
		if (!mainProductId) {
			resolve([]);
			return;
		}
		let param = {};
		param.xoql = "select id,name,quantity__c from productPackage__c where mainProduct__c=" + mainProductId;
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
var module1Etp1Change = function () {
	let params = []
	for (let i = 0; i < arguments.length; i++) {
		params.push(arguments[i])
	}
	let s = params[0].indexOf('Remote') == -1 ? '' : 'Remote'
	let l = ''
	if (params[0].indexOf('Remote') != -1) {
		if (params[0].indexOf('#') != -1 && isNumber(params[0].substring(params[0].length - 1))) {
			l = params[0].substring(params[0].length - 2)
		}
	}
	let addQuantity = 0
	let addFlag = getItemValue(vue.$data.series + s + 'ADD_Enable' + l)
	if (params[1].indexOf('AI_Module') != -1
		|| params[1].indexOf('DI_Module') != -1
		|| params[1].indexOf('PI_Module') != -1) {
		if (addFlag == true) {
			if (params[1].indexOf('AI_Module') != -1) {
				addQuantity = getItemValue(vue.$data.series + s + 'AI_ModuleADD' + l)
			} else if (params[1].indexOf('DI_Module') != -1) {
				addQuantity = getItemValue(vue.$data.series + s + 'DI_ModuleADD' + l)
			} else if (params[1].indexOf('PI_Module') != -1) {
				addQuantity = getItemValue(vue.$data.series + s + 'PI_ModuleADD' + l)
			}
		}
	}
	let XIPoints = getItemValue(params[params.length - 1]);//第一列点数
	//if(!XIPoints){
	if (!XIPoints && params[1].indexOf('AI_Module') == -1 && params[1].indexOf('DI_Module') == -1 && params[1].indexOf('PI_Module') == -1) {
		//vue.$message.warning('请先填写对应点数')
		setItemQuantity(params[0], 0)
	} else {
		if (!XIPoints && !addQuantity) {
			//	vue.$message.warning('请先填写对应点数')
			setItemQuantity(params[0], 0)
			return false
		}
		//重置 ETP
		let module1_value = getItemValue(params[1])
		let etp_value = getItemValue(params[2])
		let etp1_value = getItemValue(params[0])
		let module1_quantity = getItemQuantity(params[1])  //module1 件数
		let etp_quantity = getItemQuantity(params[2])
		let etp1_quantity = getItemQuantity(params[0])

		queryProductInfo(params[1]).then(res => {
			if (!res.slotCount__c) {
				vue.$message.warning('未获取到' + module1_value + '的点槽位数')
				return false;
			}
			let module1_product_point = res.slotCount__c;  //module1 点槽位数
			queryProductInfo(params[0]).then(res1 => {
				if (!res1.slotCount__c) {
					vue.$message.warning('未获取到' + etp1_value + '的点槽位数')
					return false;
				}
				let etp1_product_point = res1.slotCount__c
				let m1 = module1_quantity * module1_product_point
				let etp1_max = Math.ceil(m1 / etp1_product_point)   //e0+e1>m1  e1最大等于m1
				if (etp1_quantity > etp1_max) { //e0+e1=m1  e1最大等于m1
					//vue.$message.warning('超出最大可配置范围，最大值为'+etp1_max)
					setItemQuantity(params[0], etp1_max)
				}
				queryProductInfo(params[2]).then(res2 => {
					if (!res2.slotCount__c) {
						vue.$message.warning('未获取到' + etp_value + '的点槽位数')
						return false;
					}
					let a = getItemQuantity(params[0])
					let e1 = a * etp1_product_point
					let etp_product_point = res2.slotCount__c
					etp_quantity = Math.ceil((m1 - e1) / etp_product_point)
					setItemQuantity(params[2], etp_quantity)
					//系统电缆
					elco_calc(params[0])
				})
			})
		})
	}
}

/**
 * 根据主产品ID查询产品包信息
 * @param {String} mainProductId - 主产品ID（productPackage__c的外键mainProduct__c）
 * @returns {Promise} 返回查询到的records数组
 */
var queryProductPackage = function (mainProductId) {
	return new Promise(function (resolve, reject) {
		if (!mainProductId) {
			resolve([]);
			return;
		}
		let param = {};
		param.xoql = "select id,name,quantity__c from productPackage__c where mainProduct__c=" + mainProductId;
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
var aiSwitchChange = function (p, val) {
	let s = ''
	let l = ''
	let AIPointsStr = 'AIPoints'
	let AI_TcPointsStr = 'AI_TcPoints'
	if (vue.$data.series != '') {
		AIPointsStr = vue.$data.series + 'AI_Points'
		AI_TcPointsStr = vue.$data.series + 'AI_TcPoints'
	}
	let nIndex = 0
	if (p.indexOf('Remote') != -1) {
		s = 'Remote'
		if (p.indexOf('#') != -1 && isNumber(p.substring(p.length - 1))) {
			l = p.substring(p.length - 2)   //#1...2..3..
			nIndex = Number(p.substring(p.length - 1))
		}
		AIPointsStr = vue.$data.series + s + 'AI_Points' + l
		AI_TcPointsStr = vue.$data.series + s + 'AI_TC_Points' + l
	}
	//清空TC点数、卡2、端子板2
	if (vue.$data.enableAutoCalc == 'true') {
		setItemValue(AI_TcPointsStr, 0);
		setItemQuantity(vue.$data.series + s + "AI_Module2" + l, 0)
		setItemQuantity(vue.$data.series + s + "AI_ETP2" + l, 0)
		if (vue.$data.series == 'CX_') {
			setItemQuantity(vue.$data.series + s + "AI_FET2" + l, 0)
		}
	}
	if (val) {
		//	vue.$data.hasTcValue=true
		if (vue.$data.disables.indexOf(vue.$data.series + s + 'AI_Module2' + l) == -1) {
			vue.$data.disables.push(vue.$data.series + s + 'AI_Module2' + l)
		}
		if (vue.$data.series == '') {
			setItemValue(vue.$data.series + s + 'AI_Module2' + l, TcCardCode)
		}
		if (vue.$data.enableAutoCalc == 'true') {
			numCalc(AIPointsStr, { m: vue.$data.series + s + 'AI_Module' + l, e: [vue.$data.series + s + 'AI_ETP' + l, vue.$data.series + s + 'AI_ETP1' + l] }, { m: vue.$data.series + s + 'AI_Module2' + l, e: [vue.$data.series + s + 'AI_ETP2' + l] }, vue.$data.series + s + 'hasTCValue' + l)
		}
	} else {
		let ai_module2_index = vue.$data.disables.indexOf(vue.$data.series + s + 'AI_Module2' + l)
		vue.$data.disables.splice(ai_module2_index, 1)
	}
	setTimeout(function () {
		let key = vue.$data.itemApiKeys[vue.$data.series + s + "AI_Module2" + l];
		let itemId = key.split("::")[2];
		let urlMap = ''
		if (val == false) {
			urlMap = getRefrenceItemsInUrlMap({ "id": itemId }, vue.$data.oldAiCode);
		} else {
			urlMap = getRefrenceItemsInUrlMap({ "id": itemId }, TcCardCode);
		}
		refrenceItemChange(urlMap)
	}, 1)

	if (vue.$data.enableAutoCalc == 'true') {
		setTimeout(() => {
			let regStr = /Remote/g
			if (regStr.test(p)) {
				chassis_calc(nIndex)   //机架相关计算
				setTimeout(() => {
					local_calc()
				}, 4)
			} else {
				local_calc()
			}
			setTimeout(() => {
				Ex_Chassis_Quantity_All_Calc()  //总数保护
			}, 10)
		}, 200)
	}

}
var aoSwitchChange = function (p, val) {
	let s = ''
	let l = ''
	let bigAOPointsStr = 'bigAOPoints'
	let AOPointsStr = 'AOPoints'
	let nIndex = 0
	if (p.indexOf('Remote') != -1) {
		s = 'Remote'
		if (p.indexOf('#') != -1 && isNumber(p.substring(p.length - 1))) {
			l = p.substring(p.length - 2)   //#1...2..3..
			nIndex = Number(p.substring(p.length - 1))
		}
		bigAOPointsStr = 'RemotebigAO_Points' + l
		AOPointsStr = 'RemoteAO_Points' + l
	}
	let bigAoCard = "01-01-01-08-00-02";
	let hasBigAO = getItemValue(p)
	if (!hasBigAO) {
		//vue.$data.seDisables=[]
		setItemValue(bigAOPointsStr, 0)
		let AO_Module_index = vue.$data.seDisables.indexOf(vue.$data.series + s + 'AO_Module' + l)
		vue.$data.seDisables.splice(AO_Module_index, 1)
		let AO_ETP_index = vue.$data.seDisables.indexOf(vue.$data.series + s + 'AO_ETP' + l)
		vue.$data.seDisables.splice(AO_ETP_index, 1)
		let AO_ETP1_index = vue.$data.seDisables.indexOf(vue.$data.series + s + 'AO_ETP1' + l)
		vue.$data.seDisables.splice(AO_ETP1_index, 1)
		let AO_ETP1_sindex = vue.$data.disables.indexOf(vue.$data.series + s + 'AO_ETP1' + l)
		vue.$data.disables.splice(AO_ETP1_sindex, 1)
		if (vue.$data.seDisables.indexOf(vue.$data.series + s + 'AO_Module2' + l) == -1) {
			vue.$data.seDisables.push(vue.$data.series + s + 'AO_Module2' + l)
		}
		if (vue.$data.seDisables.indexOf(vue.$data.series + s + 'AO_ETP2' + l) == -1) {
			vue.$data.seDisables.push(vue.$data.series + s + 'AO_ETP2' + l)
		}
		if (vue.$data.disables.indexOf(vue.$data.series + s + 'AO_Module2' + l) == -1) {
			vue.$data.disables.push(vue.$data.series + s + 'AO_Module2' + l)
		}
		setItemValue(vue.$data.series + s + 'AOUseSameCard' + l, 'true')
		if (vue.$data.enableAutoCalc == 'false') {
			if (s == '') {
				clearNum(this.series + 'bigAOPoints')
			} else {
				clearNum(this.series + s + 'bigAO_Points' + l)
			}
			return false;
		}
		setItemQuantity(vue.$data.series + s + 'AO_Module2' + l, 0)
		setItemQuantity(vue.$data.series + s + 'AO_ETP2' + l, 0)
		setItemQuantity(vue.$data.series + s + 'AO_ETP1' + l, 0)
		setError(vue.$data.series + s + 'AO_Module2' + l, '')
		setError(vue.$data.series + s + 'AO_ETP2' + l, '')
		setError(vue.$data.series + s + 'AO_ETP1' + l, '')
		numCalc(AOPointsStr, { m: vue.$data.series + s + 'AO_Module' + l, e: [vue.$data.series + s + 'AO_ETP' + l, vue.$data.series + s + 'AO_ETP1' + l] })
	} else {
		setItemValue(vue.$data.series + s + "AO_Module2" + l, bigAoCard);
		if (vue.$data.seDisables.indexOf(vue.$data.series + s + 'AO_Module' + l) == -1) {
			vue.$data.seDisables.push(vue.$data.series + s + 'AO_Module' + l)
		}
		if (vue.$data.seDisables.indexOf(vue.$data.series + s + 'AO_ETP' + l) == -1) {
			vue.$data.seDisables.push(vue.$data.series + s + 'AO_ETP' + l)
		}
		if (vue.$data.seDisables.indexOf(vue.$data.series + s + 'AO_ETP1' + l) == -1) {
			vue.$data.seDisables.push(vue.$data.series + s + 'AO_ETP1' + l)
		}
		let s_ao_module2_index = vue.$data.seDisables.indexOf(vue.$data.series + s + 'AO_Module2' + l)
		vue.$data.seDisables.splice(s_ao_module2_index, 1)
		let s_ao_etp2_index = vue.$data.seDisables.indexOf(vue.$data.series + s + 'AO_ETP2' + l)
		vue.$data.seDisables.splice(s_ao_etp2_index, 1)
		let ao_module2_index = vue.$data.disables.indexOf(vue.$data.series + s + 'AO_Module2' + l)
		vue.$data.disables.splice(ao_module2_index, 1)
		if (vue.$data.disables.indexOf(vue.$data.series + s + 'AO_ETP2' + l) == -1) {
			vue.$data.disables.push(vue.$data.series + s + 'AO_ETP2' + l)
		}
		if (vue.$data.disables.indexOf(vue.$data.series + s + 'AO_ETP1' + l) == -1) {
			vue.$data.disables.push(vue.$data.series + s + 'AO_ETP1' + l)
		}
		if (vue.$data.enableAutoCalc == 'false') {
			if (s == '') {
				clearNum(this.series + 'bigAOPoints')
			} else {
				clearNum(this.series + s + 'bigAO_Points' + l)
			}

			return false;
		}
		setItemQuantity(vue.$data.series + s + 'AO_Module' + l, 0)
		setItemQuantity(vue.$data.series + s + 'AO_ETP' + l, 0)
		setItemQuantity(vue.$data.series + s + 'AO_ETP1' + l, 0)
		setError(vue.$data.series + s + 'AO_Module' + l, '')
		setError(vue.$data.series + s + 'AO_ETP' + l, '')
		setError(vue.$data.series + s + 'AO_ETP1' + l, '')
		aoCardCalc(AOPointsStr)
	}

	setTimeout(() => {
		// let regStr=/^Remote.*/
		let regStr = /Remote/g
		if (regStr.test(p)) {
			chassis_calc(nIndex)   //机架相关计算
			setTimeout(() => {
				local_calc()
			}, 4)
		} else {
			local_calc()
		}
		setTimeout(() => {
			Ex_Chassis_Quantity_All_Calc()  //总数保护
		}, 10)
	}, 200)
}
var etpSelectChange = function () {  //module,etp,etp1  参数
	let module_value = getItemValue(arguments[0])
	let res = getItemInfo(arguments[0])
	if (!res.slotCount__c) {
		vue.$message.warning('未获取到' + module_value + '的点槽位数')
		return false;
	} else {
		setError()
	}
	let module_point = res.slotCount__c
	let etp_value = getItemValue(arguments[1])
	let res2 = getItemInfo(arguments[1])
	if (!res2.slotCount__c) {
		vue.$message.warning('未获取到' + etp_value + '的点槽位数')
		return false;
	}
	let etp_point = res2.slotCount__c
	let module_quantity = getItemQuantity(arguments[0])
	let etp_quantity = Math.ceil(module_quantity * module_point / etp_point)
	setItemQuantity(arguments[1], etp_quantity)
	setItemQuantity(arguments[2], 0)
	elco_calc(arguments[0])
}
var aiEtpSelectChange = function (p) {
	let s = ''
	let l = ''
	let hasTCValueStr = 'hasTCValue'
	let AIPointsStr = 'AIPoints'
	let AI_TcPointsStr = 'AI_TcPoints'
	let series = ''   //配置类型  ‘TSx_.....'
	let reg = /^TSx_.*/g
	let regCx = /^CX_.*/g
	if (reg.test(p)) {
		series = 'TSx_'
	} else if (regCx.test(p)) {
		series = 'CX_'
	}
	if (series != '') {
		hasTCValueStr = series + 'hasTCValue'
		AIPointsStr = series + 'AI_Points'
		AI_TcPointsStr = series + 'AI_TcPoints'
	}
	if (p.indexOf('Remote') != -1) {
		s = 'Remote'
		if (p.indexOf('#') != -1 && isNumber(p.substring(p.length - 1))) {
			l = p.substring(p.length - 2)   //#1...2..3..
		}
		hasTCValueStr = series + s + 'hasTCValue' + l
		AIPointsStr = series + 'RemoteAI_Points' + l
		AI_TcPointsStr = series + 'RemoteAI_TC_Points' + l
	}

	let hasTcValue = getItemValue(hasTCValueStr)
	if (hasTcValue) {
		numCalc(AI_TcPointsStr, { m: series + s + 'AI_Module2' + l, e: [series + s + 'AI_ETP2' + l] }, hasTCValueStr)
	} else {
		setItemQuantity(series + s + 'AI_Module2' + l, 0)
		if (vue.$data.series == 'CX_') {
			setItemQuantity(series + s + 'AI_FET2' + l, 0)
		}
		module2NumChange(series + s + 'AI_Module2' + l, series + s + 'AI_ETP2' + l, { m: series + s + 'AI_Module' + l, e: [series + s + 'AI_ETP' + l, series + s + 'AI_ETP1' + l] }, AIPointsStr)
	}
}

/**
 * 根据主产品ID查询产品包信息
 * @param {String} mainProductId - 主产品ID（productPackage__c的外键mainProduct__c）
 * @returns {Promise} 返回查询到的records数组
 */
var queryProductPackage = function (mainProductId) {
	return new Promise(function (resolve, reject) {
		if (!mainProductId) {
			resolve([]);
			return;
		}
		let param = {};
		param.xoql = "select id,name,quantity__c from productPackage__c where mainProduct__c=" + mainProductId;
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
var clearNum = function () {
	for (let i = 0; i < arguments.length; i++) {
		setItemValue(arguments[i], 0);
	}
}

/**
 * 根据主产品ID查询产品包信息
 * @param {String} mainProductId - 主产品ID（productPackage__c的外键mainProduct__c）
 * @returns {Promise} 返回查询到的records数组
 */
var queryProductPackage = function (mainProductId) {
	return new Promise(function (resolve, reject) {
		if (!mainProductId) {
			resolve([]);
			return;
		}
		let param = {};
		param.xoql = "select id,name,quantity__c from productPackage__c where mainProduct__c=" + mainProductId;
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

var aoCardCalc = function (p) {
	let s = ''
	let l = ''
	let AOPointsStr = 'AOPoints'
	let hasBigAOStr = 'hasBigAO'
	let bigAOPointsStr = 'bigAOPoints'
	let AOUseSameCardStr = 'AOUseSameCard'
	if (p.indexOf('Remote') != -1) {
		s = 'Remote'
		if (p.indexOf('#') != -1 && isNumber(p.substring(p.length - 1))) {
			l = p.substring(p.length - 2)
		}
		AOPointsStr = vue.$data.series + 'RemoteAO_Points' + l
		hasBigAOStr = vue.$data.series + 'RemotehasBigAO' + l
		bigAOPointsStr = vue.$data.series + 'RemotebigAO_Points' + l
		AOUseSameCardStr = vue.$data.series + 'RemoteAOUseSameCard' + l
	}
	let bigAoCard = "01-01-01-08-00-02";
	let bigAoCardQuantity = 0;//大电流卡件数
	let normalAoCardQuantity = 0;//普通电流卡件数
	let aoPoints = getItemValue(AOPointsStr);//AO点数
	let hasBigAo = getItemValue(hasBigAOStr);//AO是否有大电流
	let bigAoPoints = getItemValue(bigAOPointsStr);//AO 大电流卡点数
	let aoUseSameCard = getItemValue(AOUseSameCardStr) == "true" ? true : false;//剩余AO是否使用同种电流卡
	let pointBuff = getItemValue("pointBuff");//点数备用量
	let aoModuleValue = getItemValue(vue.$data.series + s + 'AO_Module' + l)
	let aoEtpValue = getItemValue(vue.$data.series + s + 'AO_ETP' + l)
	let aoEtp1Value = getItemValue(vue.$data.series + s + 'AO_ETP1' + l)
	if (hasBigAo) {
		if (aoUseSameCard) {
			let AO_Module_index = vue.$data.seDisables.indexOf(vue.$data.series + s + 'AO_Module2' + l)
			vue.$data.seDisables.splice(AO_Module_index, 1)
			let AO_ETP_index = vue.$data.seDisables.indexOf(vue.$data.series + s + 'AO_ETP2' + l)
			vue.$data.seDisables.splice(AO_ETP_index, 1)
			if (vue.$data.seDisables.indexOf(vue.$data.series + s + 'AO_Module' + l) == -1) {
				vue.$data.seDisables.push(vue.$data.series + s + 'AO_Module' + l)
			}
			if (vue.$data.seDisables.indexOf(vue.$data.series + s + 'AO_ETP' + l) == -1) {
				vue.$data.seDisables.push(vue.$data.series + s + 'AO_ETP' + l)
			}
			if (vue.$data.seDisables.indexOf(vue.$data.series + s + 'AO_ETP1' + l) == -1) {
				vue.$data.seDisables.push(vue.$data.series + s + 'AO_ETP1' + l)
			}
			if (vue.$data.disables.indexOf(vue.$data.series + s + 'AO_Module' + l) == -1) {
				vue.$data.disables.push(vue.$data.series + s + 'AO_Module' + l)
			}
			if (vue.$data.disables.indexOf(vue.$data.series + s + 'AO_ETP' + l) == -1) {
				vue.$data.disables.push(vue.$data.series + s + 'AO_ETP' + l)
			}
			if (vue.$data.disables.indexOf(vue.$data.series + s + 'AO_ETP1' + l) == -1) {
				vue.$data.disables.push(vue.$data.series + s + 'AO_ETP1' + l)
			}
			if (vue.$data.disables.indexOf(vue.$data.series + s + 'AO_ETP2' + l) == -1) {
				vue.$data.disables.push(vue.$data.series + s + 'AO_ETP2' + l)
			}
		} else {
			let ao_module_index = vue.$data.seDisables.indexOf(vue.$data.series + s + 'AO_Module' + l)
			vue.$data.seDisables.splice(ao_module_index, 1)
			let ao_etp_index = vue.$data.seDisables.indexOf(vue.$data.series + s + 'AO_ETP' + l)
			vue.$data.seDisables.splice(ao_etp_index, 1)
			let ao_etp1_sindex = vue.$data.seDisables.indexOf(vue.$data.series + s + 'AO_ETP1' + l)
			vue.$data.seDisables.splice(ao_etp1_sindex, 1)
			let ao_etp1_index = vue.$data.disables.indexOf(vue.$data.series + s + 'AO_ETP1' + l)
			vue.$data.disables.splice(ao_etp1_index, 1)
		}

	} else {
		if (vue.$data.seDisables.indexOf(vue.$data.series + s + 'AO_Module2' + l) == -1) {
			vue.$data.seDisables.push(vue.$data.series + s + 'AO_Module2' + l)
		}
		if (vue.$data.seDisables.indexOf(vue.$data.series + s + 'AO_ETP2' + l) == -1) {
			vue.$data.seDisables.push(vue.$data.series + s + 'AO_ETP2' + l)
		}

	}
	/**
	 * 如果点数备用量大于0则所有点数都按照增加了备用量的值参与后续计算。
	 */
	if (pointBuff > 0) {
		aoPoints = Math.ceil(aoPoints * (1 + pointBuff / 100));//ao 实际计算点数
	}

	/**
	 * AO卡的计算:根据是否有大电流 进行分别的计算。
	 */
	if (hasBigAo) {
		setItemValue(vue.$data.series + s + "AO_Module2" + l, bigAoCard);
		let normalAoPoints = 0;//当区分出有大电流时就需要算出大电流点数和常规电流点数。
		//有大电流
		if (bigAoPoints < 1) {
			// vue.$message("请输入"+l+"正确的大电流卡点数");
			// return;
		}
		//计算大电流卡件数。大电流卡件数=大电流点数/2;
		bigAoCardQuantity = Math.ceil(bigAoPoints / 2);
		//计算常规电流点数。常规电流点数=实际计算点数-大电流卡件数*6;
		normalAoPoints = (aoPoints - (bigAoCardQuantity * 6) <= 0 ? 0 : aoPoints - (bigAoCardQuantity * 6));
		if (normalAoPoints == 0) {
			//大电流看已经能够满足需求，不需要普通电流卡
			normalAoCardQuantity = 0;
		} else if (normalAoPoints > 0 && aoUseSameCard) {
			//还有普通电流点数，并且要求同样使用大电流卡
			bigAoCardQuantity = bigAoCardQuantity + Math.ceil(normalAoPoints / 6);
		} else if (normalAoPoints > 0 && (!aoUseSameCard)) {
			//还有普通电流点数，并且要求使用常规电流卡
			normalAoCardQuantity = Math.ceil(normalAoPoints / 8);
		}
		setItemQuantity(vue.$data.series + s + "AO_Module2" + l, bigAoCardQuantity);

		let AO_Module2_value = getItemValue(vue.$data.series + s + 'AO_Module2' + l)
		queryProductInfo(vue.$data.series + s + 'AO_Module2' + l).then(res1 => {
			if (res1.slotCount__c) {
				let AO_Module2_point = res1.slotCount__c
				let AO_Etp2_value = getItemValue(vue.$data.series + s + 'AO_ETP2' + l)
				queryProductInfo(vue.$data.series + s + 'AO_ETP2' + l).then(res => {
					if (res.slotCount__c) {
						let aoEtp2Point = res.slotCount__c
						let aoEtp2Quantity = Math.ceil(bigAoCardQuantity * AO_Module2_point / aoEtp2Point)
						setItemQuantity(vue.$data.series + s + 'AO_ETP2' + l, aoEtp2Quantity)
						setError(vue.$data.series + s + 'AO_ETP2' + l, '')
					} else {
						if (vue.$data.disables.indexOf(vue.$data.series + s + 'AO_ETP2' + l) == -1) {
							vue.$data.disables.push(vue.$data.series + s + 'AO_ETP2' + l)
						}
						setError(vue.$data.series + s + 'AO_ETP2' + l, '未获取到点槽位数')
						return false
					}
				})
				setError(vue.$data.series + s + 'AO_Module2' + l, '')
			} else {
				setError(vue.$data.series + s + 'AO_Module2' + l, '未获取到点槽位数')
				return false
				//vue.$message.warning('未获取到'+AO_Module2_value+'的点槽位数')
			}
		})

		let key = vue.$data.itemApiKeys[vue.$data.series + s + "AO_Module2" + l];
		let blockId = key.split("::")[1];
		let itemId = key.split("::")[2];
		let item = { id: itemId };
		let urlMap = getRefrenceItemsInUrlMap({ "id": itemId }, bigAoCard);
		refrenceItemChange(urlMap);
	} else {
		//没有大电流
		normalAoCardQuantity = Math.ceil(aoPoints / 8);
		//没有大电流 清空大电流点数、恢复剩余点数使用同种卡设置、AO卡2、AO端子板2清空

		setItemValue(bigAOPointsStr, 0)
		setItemValue(AOUseSameCardStr, 'true')
		//	setItemValue(s+"AO_Module2"+l, "");
		setItemQuantity(vue.$data.series + s + "AO_Module2" + l, undefined);
		//	setItemValue(s+'AO_ETP2'+l, '')
		setItemQuantity(vue.$data.series + s + "AO_ETP2" + l, undefined);
		setError(vue.$data.series + s + 'AO_Module2' + l, '')
		setError(vue.$data.series + s + 'AO_ETP2' + l, '')
	}
	setItemQuantity(vue.$data.series + s + "AO_Module" + l, normalAoCardQuantity);
	aoModuleValue = getItemValue(vue.$data.series + s + 'AO_Module' + l)

	let nIndex = 0
	if (p.indexOf('Remote') != -1) {
		if (p.indexOf('#') != -1 && isNumber(p.substring(p.length - 1))) {
			nIndex = Number(p.substring(p.length - 1))
		}
	}

	queryProductInfo(vue.$data.series + s + 'AO_Module' + l).then(res => {
		if (res.slotCount__c) {
			let ao_module_point = res.slotCount__c
			aoEtpValue = getItemValue(vue.$data.series + s + 'AO_ETP' + l)
			queryProductInfo(vue.$data.series + s + 'AO_ETP' + l).then(res2 => {
				if (!res2.slotCount__c) {
					setError(vue.$data.series + s + 'AO_ETP' + l, '未获取到点槽位数')
					return false;
				}
				let etpPoint = res2.slotCount__c
				let a = ao_module_point * normalAoCardQuantity
				let etpQuantity = Math.ceil(a / etpPoint)
				setItemQuantity(vue.$data.series + s + 'AO_ETP' + l, etpQuantity)
				setItemQuantity(vue.$data.series + s + 'AO_ETP1' + l, 0)
				setError(vue.$data.series + s + 'AO_ETP' + l, '')
				setError(vue.$data.series + s + 'AO_ETP1' + l, '')
			})
		}
	})
	elco_calc(arguments[0])
	setTimeout(() => {
		// let regStr=/^Remote.*/
		let regStr = /Remote/g
		if (regStr.test(p)) {
			chassis_calc(nIndex)   //机架相关计算
			setTimeout(() => {
				local_calc()
			}, 4)
		} else {
			if (p != 'pointBuff') {
				local_calc()
			}
		}
	}, 200)
}
var elco_calc = function (p) {
	setTimeout(() => {
		let s = ''
		let l = ''
		let etps_quantity = 0
		if (p.indexOf('Remote') != -1) {
			s = 'Remote'
			let n = 0
			if (p.indexOf('#') != -1) {
				l = p.substring(p.length - 2)
				n = Number(p.substring(p.length - 1))
			}
			etps_quantity = getAllRemoteETPQuantity(n)
		} else {
			etps_quantity = getAllLocalETPQuantity()
		}
		if (vue.$data.series == '') {
			setItemQuantity(vue.$data.series + s + 'ELCO_Cable' + l, etps_quantity)
			setItemQuantity(vue.$data.series + s + 'ELCO_Cable2' + l, 0)
		} else {
			setItemQuantity(vue.$data.series + s + 'IO_Cable' + l, etps_quantity)
			setItemQuantity(vue.$data.series + s + 'IO_Cable2' + l, 0)
		}
	}, 100)
}
var elco2_calc = function (val, n) {
	let a = 0
	let str = ''
	let lastStr = ''
	if (n == undefined) {
		a = getAllLocalETPQuantity()
	} else {
		a = getAllRemoteETPQuantity(n)
		str = 'Remote'
		if (n > 0) {
			lastStr = '#' + n
		}
	}
	let coCable = str + 'ELCO_Cable' + lastStr
	let coCable2 = str + 'ELCO_Cable2' + lastStr
	if (vue.$data.series != '') {
		coCable = vue.$data.series + str + 'IO_Cable' + lastStr
		coCable2 = vue.$data.series + str + 'IO_Cable2' + lastStr
	}
	if (a > 0) {
		if (val > a) {
			setItemQuantity(coCable, 0)
			setItemQuantity(coCable2, a)
		} else {
			setItemQuantity(coCable, a - val)
		}
	} else {
		setItemQuantity(coCable, 0)
		setItemQuantity(coCable2, 0)
	}
}

/**
 * 根据主产品ID查询产品包信息
 * @param {String} mainProductId - 主产品ID（productPackage__c的外键mainProduct__c）
 * @returns {Promise} 返回查询到的records数组
 */
var queryProductPackage = function (mainProductId) {
	return new Promise(function (resolve, reject) {
		if (!mainProductId) {
			resolve([]);
			return;
		}
		let param = {};
		param.xoql = "select id,name,quantity__c from productPackage__c where mainProduct__c=" + mainProductId;
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
var FjumperCalc = function (p, val) {
	let s = ''
	let l = ''
	if (p.indexOf('Remote') != -1) {
		s = 'Remote'
		if (p.indexOf('#') != -1 && isNumber(p.substring(p.length - 1))) {
			l = p.substring(p.length - 2)   //#1...2..3..
		}
	}
	let a = getItemQuantity(vue.$data.series + s + 'Ex_Chassis' + l)
	let c = 0
	if (s == 'Remote') {
		c = (a - 1) * 3
	} else {
		c = a * 3
	}
	let b = 0
	b = (c - val) > 0 ? (c - val) : 0
	if (val > c) {
		setItemQuantity(p, c)
	}
	setItemQuantity(vue.$data.series + s + 'IOBus_FJumper' + l, b)
}
var TSxModule2num = function (p, val) {
	let s = ''
	let l = ''
	if (p.indexOf('Remote') != -1) {
		s = 'Remote'
		if (p.indexOf('#') != -1 && isNumber(p.substring(p.length - 1))) {
			l = p.substring(p.length - 2)   //#1...2..3..
		}
	}
	let moduleSlot = getItemInfo(vue.$data.series + s + 'PI_Module' + l).slotCount__c
	let pointBuff = getItemValue('TSx_pointBuff')
	//let a=Math.ceil((getItemValue('TSx_'+s+'PI_Points'+l)*(1+pointBuff)+getItemValue('TSx_'+s+'OSP_Group'+l))/moduleSlot)
	let a = Math.ceil(getItemValue('TSx_' + s + 'PI_Points' + l) * (1 + pointBuff / 100) / moduleSlot)
	let b = getItemValue('TSx_' + s + 'OSP_Group' + l)
	let q = getItemValue('TSx_' + s + 'PI_ModuleADD' + l) || 0
	let n = a > b ? a : b
	n = n + q
	let m = getItemInfo('TSx_' + s + 'PI_Module2' + l).slotCount__c;
	let m2 = getItemInfo('TSx_' + s + 'PI_ETP2' + l).slotCount__c
	if (val > n) {
		setItemQuantity(p, n)
		setItemQuantity('TSx_' + s + 'PI_ETP2' + l, Math.ceil(n * m / m2))
		setItemQuantity('TSx_' + s + 'PI_Module' + l, 0)
		setItemQuantity('TSx_' + s + 'PI_ETP' + l, 0)
	} else {
		setItemQuantity('TSx_' + s + 'PI_Module' + l, n - val)
		let mm = getItemInfo('TSx_' + s + 'PI_Module' + l).slotCount__c
		let mm2 = getItemInfo('TSx_' + s + 'PI_ETP' + l).slotCount__c
		setItemQuantity('TSx_' + s + 'PI_ETP' + l, Math.ceil((n - val) * mm / mm2))
		setItemQuantity('TSx_' + s + 'PI_ETP2' + l, Math.ceil(val * m / m2))
	}
}

/**
 * 根据主产品ID查询产品包信息
 * @param {String} mainProductId - 主产品ID（productPackage__c的外键mainProduct__c）
 * @returns {Promise} 返回查询到的records数组
 */
var queryProductPackage = function (mainProductId) {
	return new Promise(function (resolve, reject) {
		if (!mainProductId) {
			resolve([]);
			return;
		}
		let param = {};
		param.xoql = "select id,name,quantity__c from productPackage__c where mainProduct__c=" + mainProductId;
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
/**
 * 本地扩展架计算  Tricon
 */
var Ex_Chassis_Quantity_Calc = function () {
	let pq = 0
	if (vue.$data.series == 'TSx_' || vue.$data.series == 'CX_') {
		let ex_chassis_add = getItemValue(vue.$data.series + 'Ex_ChassisADD') || 0
		let localIOCardsQuantity = getAllLocalCardQuantity();//所有本地卡件数量
		let main_slot = Number(getItemInfo(vue.$data.series + 'Main_Chassis').slotCount__c) || 0; //主机架可用槽位数
		let main_q = getItemQuantity(vue.$data.series + 'CM_Module')
		let spc_q = getItemQuantity(vue.$data.series + 'CM_Module_Spec')
		let all = main_q + spc_q
		switch (all) {
			case 1:
				main_slot = main_slot + 1
				break;
			case 4:
				main_slot = main_slot - 1
				break;
		}
		let ex_slot = Number(getItemInfo(vue.$data.series + 'Ex_Chassis').slotCount__c) || 1; //扩展机架可用槽位数
		let m = getAllRemoteCardCount()
		// pq=Math.ceil((localIOCardsQuantity-main_slot)/ex_slot)+ex_chassis_add
		pq = Math.ceil((localIOCardsQuantity - main_slot) / ex_slot)
		pq = ex_chassis_tsx_calc(main_slot, pq) + ex_chassis_add
		if (vue.$data.series == 'TSx_') {
			setItemQuantity('TSx_IOBus_MFCM', pq * 6)
			setItemQuantity('TSx_IOBus_FJumper2', 0)
		} else {
			//	let n=m>0?3:0
			//	setItemQuantity(vue.$data.series+'IOBus_IMFF',n)
			// 	let nn=m>0?(pq-1)*3:pq*3//
			let nn = pq * 3;
			setItemQuantity(vue.$data.series + 'IOBus_IMSS', nn)
		}
		if (vue.$data.series != 'CX_') {
			setItemQuantity(vue.$data.series + 'IOBus_FJumper', pq * 3)
		}
	}
	else {
		//先计算出本地最小扩展机架数量
		//然后再计算带有备用量的本地扩展机架数量 最后用最小扩展机架数量和带有备用量的扩展机架参与运算算出扩展机架数量作为最终计算结果

		let CM_Module_Spec = getItemQuantity(vue.$data.series + "CM_Module_Spec");//特殊通讯卡数量

		if (CM_Module_Spec > 2) {
			vue.$message.warning('最大允许输入2个特殊通讯卡');
			setItemQuantity(vue.$data.series + "CM_Module_Spec", 2);
		}
		CM_Module_Spec = Math.ceil(CM_Module_Spec / 2);
		let Main_Chassis_Quantity = getItemQuantity(vue.$data.series + "Main_Chassis");//主机架数量
		//let Master_RemoteChassis_Quantity=getItemQuantity("Master_RemoteChassis");//本地远程机架数量
		let Master_RemoteChassis_Quantity = Master_RemoteChassis_calc() //本地远程机架数量
		let localIOCardsQuantity = getAllLocalCardQuantity();//所有本地卡件数量
		let remoteIOCardsQuantity = getAllRemoteCardCount();//所有远程卡件数量
		let soltBuff = getItemValue(vue.$data.series + 'slotBuff');//slotBuff
		if (soltBuff == undefined) {
			soltBuff = 0
		}
		let Master_RemoteChassis_productInfo = {}
		if (vue.$data.series == '') {
			Master_RemoteChassis_productInfo = getItemInfo("Master_RXMChassis") || {};
		}
		if (Master_RemoteChassis_productInfo.slotCount__c == undefined) {
			Master_RemoteChassis_productInfo.slotCount__c = 0
		}
		let Main_Chassis_productInfo = getItemInfo(vue.$data.series + "Main_Chassis");
		let main_chassis_slot = Number(Main_Chassis_productInfo.slotCount__c) || 0;
		//这块逻辑暂时注释测试
		// let main_q=getItemQuantity(vue.$data.series+'Main_Chassis')
		// let spc_q=getItemQuantity(vue.$data.series+'CM_Module_Spec')
		// let all=main_q+spc_q
		// switch (all) {
		// 	case 1:
		// 		main_chassis_slot=main_chassis_slot+1
		// 		break;
		// 	case 4:
		// 		main_chassis_slot=main_chassis_slot-1
		// 		break;
		// }
		let Main_Chassis_AllPoints_Quantity = Main_Chassis_Quantity * main_chassis_slot;//主机架数量*槽位数
		let Master_RemoteChassis_AllPoints_Quantity = Master_RemoteChassis_Quantity * Master_RemoteChassis_productInfo.slotCount__c;//本地远端机架数*槽位数
		let Ex_Chassi_Min = (localIOCardsQuantity + CM_Module_Spec - Main_Chassis_AllPoints_Quantity - Master_RemoteChassis_AllPoints_Quantity);
		Ex_Chassi_Min = Ex_Chassi_Min < 0 ? 0 : Ex_Chassi_Min;
		//计算出最小扩展机架数量
		Ex_Chassi_Min = Math.ceil(Ex_Chassi_Min / 8);
		//开始计算带Buff的扩展机架数量
		let Salve_RemoteChassis_AllPoints_Quantity = 0;//所有远端的Salve_RemoteChassis的位数累加
		let RemoteEx_Chassis_AllPoints_Quantity = 0;//所有远端的RemoteEx_Chassis的位数累加
		Salve_RemoteChassis_AllPoints_Quantity += Salve_RemoteChassis_Points_Calc(0);
		RemoteEx_Chassis_AllPoints_Quantity += RemoteEx_Chassis_Points_Calc(0);
		if (vue.$data.copyBlocks.length > 0) {
			vue.$data.copyBlocks.forEach(item => {
				let i = Number(item.id.substring(item.id.length - 1))
				Salve_RemoteChassis_AllPoints_Quantity += Salve_RemoteChassis_Points_Calc(i);
				RemoteEx_Chassis_AllPoints_Quantity += RemoteEx_Chassis_Points_Calc(0);
			})
		}
		//带备用量的扩展机架计算
		let Ex_Chassis_Buff = Math.ceil((localIOCardsQuantity + remoteIOCardsQuantity) * (1 + soltBuff / 100)) + CM_Module_Spec - (Main_Chassis_AllPoints_Quantity + Master_RemoteChassis_AllPoints_Quantity + Salve_RemoteChassis_AllPoints_Quantity + RemoteEx_Chassis_AllPoints_Quantity);
		Ex_Chassis_Buff = Ex_Chassis_Buff < 0 ? 0 : Ex_Chassis_Buff;
		Ex_Chassis_Buff = Math.ceil(Ex_Chassis_Buff / 8);

		pq = Ex_Chassi_Min + (Ex_Chassis_Buff - Ex_Chassi_Min < 0 ? 0 : (Ex_Chassis_Buff - Ex_Chassi_Min));
		let ex_chassis_add = getItemValue(vue.$data.series + 'Ex_ChassisADD')
		pq = pq + ex_chassis_add
	}
	setItemQuantity(vue.$data.series + "Ex_Chassis", pq);
	return pq
}

/**
 * 本地扩展架计算  Tsxplus
 */
var ex_chassis_tsx_calc = function (slot, ec) { //slot 本地主机架实际槽位数  ec 已知本地计算出的扩展机架数量
	let ec_quantity = 0
	//1.远程扩展机架总和
	let RemoteEx_Chassis_all = 0
	let RemoteEx_Chassis = RemoteEx_Chassis_Count_Calc(0)
	let b = 0
	if (vue.$data.copyBlocks.length > 0) {
		let RemoteEx_Chassis_arr = []
		vue.$data.copyBlocks.forEach((item) => {
			let lastStr = item.id.substring(item.id.length - 2)
			RemoteEx_Chassis_arr.push(getItemQuantity(vue.$data.series + 'RemoteEx_Chassis' + lastStr))
		})
		if (RemoteEx_Chassis_arr.length) {
			b = RemoteEx_Chassis_arr.reduce((prev, curr) => {
				return prev + curr
			})
		}
	}
	RemoteEx_Chassis_all = Number.parseInt(b) + Number.parseInt(RemoteEx_Chassis);
	//2.远程I/O卡件总和
	let remote_card_all = getAllRemoteCardCount();//所有远程卡件数量
	//3.本地主机架实际提供的槽位数  slot
	//4.本地I/O卡件总和
	let local_card_all = getAllLocalCardQuantity();//所有本地卡件数量
	//5.已知本地计算出的扩展机架数量 ec
	//计算1
	let slotBuff = getItemValue(vue.$data.series + 'slotBuff')
	let ex_slot = getItemInfo(vue.$data.series + 'Ex_Chassis').slotCount__c || 1
	let remote_ex_slot = getItemInfo(vue.$data.series + 'RemoteEx_Chassis').slotCount__c || 1
	let calc1 = Math.ceil(((remote_card_all + local_card_all) * (1 + slotBuff / 100) - slot - RemoteEx_Chassis_all * remote_ex_slot) / ex_slot)
	//计算2
	let calc2 = calc1 > ec ? calc1 : ec
	ec_quantity = calc2
	let flag = getItemValue(vue.$data.series + 'RemoteConnect')
	if (flag == true) {
		let len = vue.$data.copyBlocks.length + 1
		let calc3 = len > 3 ? (len - 3) : 0
		let calc4 = calc3 > calc2 ? calc3 : calc2
		ec_quantity = calc4
	}
	setItemQuantity(vue.$data.series + 'Ex_Chassis', ec_quantity)
	return ec_quantity;
}
/**
 * 单套远程机架点数
 * @constructor
 */
var Salve_RemoteChassis_Points_Calc = function (i) {
	let Salve_RemoteChassis_Points = 0;
	let Salve_RemoteChassis = 0
	let Salve_RemoteChassisProductInfo = {}
	if (i == 0) {
		if (vue.$data.series == '') {
			Salve_RemoteChassis = getItemQuantity(vue.$data.series + "Salve_RemoteChassis");
			Salve_RemoteChassisProductInfo = getItemInfo(vue.$data.series + "Salve_RemoteChassis");
		}
	} else {
		if (vue.$data.series == '') {
			Salve_RemoteChassis = getItemQuantity("Salve_RemoteChassis#" + i);
			Salve_RemoteChassisProductInfo = getItemInfo("Salve_RemoteChassis#" + i);
		}
	}
	if (Salve_RemoteChassisProductInfo.slotCount__c == undefined) {
		Salve_RemoteChassisProductInfo.slotCount__c = 0
	}
	Salve_RemoteChassis_Points = Salve_RemoteChassisProductInfo.slotCount__c * Salve_RemoteChassis
	return Salve_RemoteChassis_Points;
}
/**
 * 单套远程扩展机架点数
 * @constructor
 */
var RemoteEx_Chassis_Points_Calc = function (i) {
	let RemoteEx_Chassis_Points = 0;
	let RemoteEx_Chassis = 0
	let RemoteEx_ChassisProductInfo = {}
	if (i == 0) {
		// if(vue.$data.series==''){
		RemoteEx_Chassis = getItemQuantity(vue.$data.series + "RemoteEx_Chassis");
		RemoteEx_ChassisProductInfo = getItemInfo(vue.$data.series + "RemoteEx_Chassis");
		//	}
	} else {
		//	if(vue.$data.series==''){
		RemoteEx_Chassis = getItemQuantity(vue.$data.series + "RemoteEx_Chassis#" + i);
		RemoteEx_ChassisProductInfo = getItemInfo(vue.$data.series + "RemoteEx_Chassis#" + i);
		//	}
	}
	if (RemoteEx_ChassisProductInfo.slotCount__c == undefined) {
		RemoteEx_ChassisProductInfo.slotCount__c = 0
	}
	RemoteEx_Chassis_Points = RemoteEx_ChassisProductInfo.slotCount__c * RemoteEx_Chassis
	return RemoteEx_Chassis_Points;
}
/**
 *机架总数保护 机架之和Chassis_Sum >15,提醒《系统机架之和>15不支持，建议拆分系统》
 * Chassis_Sum=Main_Chassis数量+ Ex_Chassis数量+Master_RemoteChassis数量+ Salve_RemoteChassis[ ]数量+RemoteEx_Chassis数量[ ]
 * @constructor
 */
var Ex_Chassis_Quantity_All_Calc = function () {
	let Chassis_Sum = 0
	let Main_Chassis = getItemQuantity(vue.$data.series + 'Main_Chassis') || 0
	let Ex_Chassis22 = getItemQuantity(vue.$data.series + 'Ex_Chassis') || 0
	let Master_RemoteChassis = 0
	let Salve_RemoteChassis = 0
	if (vue.$data.series == '') {
		Master_RemoteChassis = getItemQuantity(vue.$data.series + 'Master_RXMChassis')
		Salve_RemoteChassis = getItemQuantity(vue.$data.series + 'Salve_RemoteChassis')
	}
	let RemoteEx_Chassis = RemoteEx_Chassis_Count_Calc(0)
	if (vue.$data.copyBlocks.length > 0) {
		let Salve_RemoteChassis_arr = []
		let RemoteEx_Chassis_arr = []
		vue.$data.copyBlocks.forEach((item) => {
			let lastStr = item.id.substring(item.id.length - 2)
			if (vue.$data.series == '') {
				Salve_RemoteChassis_arr.push(getItemQuantity(vue.$data.series + 'Salve_RemoteChassis' + lastStr))
			}
			RemoteEx_Chassis_arr.push(getItemQuantity(vue.$data.series + 'RemoteEx_Chassis' + lastStr))
		})
		let a = 0
		if (Salve_RemoteChassis_arr.length) {
			a = Salve_RemoteChassis_arr.reduce((prev, curr) => {
				return prev + curr
			})
		}
		Salve_RemoteChassis = a + Salve_RemoteChassis
		let b = 0
		if (RemoteEx_Chassis_arr.length) {
			b = RemoteEx_Chassis_arr.reduce((prev, curr) => {
				return prev + curr
			})
		}
		RemoteEx_Chassis = Number.parseInt(b) + Number.parseInt(RemoteEx_Chassis);
	}
	Chassis_Sum = Number.parseInt(Main_Chassis) + Number.parseInt(Ex_Chassis22) + Number.parseInt(Master_RemoteChassis) + Number.parseInt(Salve_RemoteChassis) + Number.parseInt(RemoteEx_Chassis);
	vue.$data.Chassis_Sum = Chassis_Sum
	if (Chassis_Sum > 15) {
		vue.$message.warning('系统机架之和>15不支持，建议拆分系统');
	}
}

/**
 * 根据主产品ID查询产品包信息
 * @param {String} mainProductId - 主产品ID（productPackage__c的外键mainProduct__c）
 * @returns {Promise} 返回查询到的records数组
 */
var queryProductPackage = function (mainProductId) {
	return new Promise(function (resolve, reject) {
		if (!mainProductId) {
			resolve([]);
			return;
		}
		let param = {};
		param.xoql = "select id,name,quantity__c from productPackage__c where mainProduct__c=" + mainProductId;
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
/**
 *远程计算
 * @constructor
 */
//pointbuff变化时
var chassis_all_calc = function () {
	chassis_calc(0)
	if (vue.$data.copyBlocks.length > 0) {
		vue.$data.copyBlocks.forEach(item => {
			let n = Number(item.id.substring(item.id.length - 1))
			chassis_calc(n)
		})
	}
	setTimeout(() => {
		local_calc()
	}, 4)
}
var getAll4703 = function () {
	let n = 0
	let m = getItemQuantity(vue.$data.series + 'IOBus_IMFFRemote')
	vue.$data.copyBlocks.forEach(item => {
		let a = item.id.split('#')[1]
		n += getItemQuantity(vue.$data.series + 'IOBus_IMFFRemote#' + a) || 0
	})
	return n + m;
}
var chassis_calc = function (n) {  //远端
	let str = n > 0 ? '#' + n : ''
	Salve_RemoteChassis_calc(n) //远程机架、远程通讯卡、单模跳线、单模光模块
	setTimeout(() => {
		let RemoteEx_ChassisCount = RemoteEx_Chassis_Count_Calc(n)
		setItemQuantity(vue.$data.series + 'RemoteEx_Chassis' + str, RemoteEx_ChassisCount) //远程扩展机架
		if (vue.$data.series != 'TSx_') {
			setItemQuantity(vue.$data.series + 'RemoteIObus_Cable' + str, RemoteEx_ChassisCount) //远程I/O电缆
		} else {
			//多模跳线
			setItemQuantity('TSx_RemoteIOBus_FJumper' + str, (RemoteEx_ChassisCount - 1) * 3)
			//多模光模块
			setItemQuantity('TSx_RemoteIOBus_MFCM' + str, (RemoteEx_ChassisCount - 1) * 6)
		}
		//远程机架空槽板（卡）
		if (vue.$data.series != 'CX_') {
			let RemoteBlankSlotPanel_quantity = 0
			let Salve_RemoteChassis_quantity = getItemQuantity('Salve_RemoteChassis' + str) || 0
			let Slave_CMRemote_quantity = getItemQuantity('Slave_CMRemote' + str) || 0
			let m = getAllRemoteCardQuantity(n)
			let p = (Salve_RemoteChassis_quantity + RemoteEx_ChassisCount) * 16
			RemoteBlankSlotPanel_quantity = (p - Slave_CMRemote_quantity - m) > 0 ? (p - Slave_CMRemote_quantity - m) : 0
			setItemQuantity(vue.$data.series + 'RemoteBlankSlotPanel' + str, RemoteBlankSlotPanel_quantity)
		} else {
			setItemQuantity(vue.$data.series + 'RemoteIOBus_RJ45Cable' + str, (RemoteEx_ChassisCount - 1) * 3)
			let m = getAllRemoteCardQuantity(n)
			setItemQuantity(vue.$data.series + 'RemoteBlankSlotPanel' + str, m)
			let nn = 0
			if (getItemInfo(vue.$data.series + 'RemoteEx_Chassis' + str).slotCount__c) {
				nn = Math.ceil(RemoteEx_ChassisCount * getItemInfo(vue.$data.series + 'RemoteEx_Chassis' + str).slotCount__c - m)
			}
			setItemQuantity(vue.$data.series + 'RemoteBlankSlotPanel2' + str, nn)
		}
	})
	setTimeout(() => {
		let a = RemotePS_Module_Quantity_calc('Salve_RemoteChassis' + str, vue.$data.series + 'RemoteEx_Chassis' + str) //远程机架电源
		if (vue.$data.series == 'CX_') {
			let ex = getItemQuantity(vue.$data.series + 'RemoteEx_Chassis' + str)
			let ps = getItemInfo(vue.$data.series + 'RemotePS_Module' + str).wattage__c || 1
			a = (Math.ceil(ex * 8 * 24 / ps)) * 2
			setItemQuantity('CX_IOBus_IMSSRemote' + str, Math.ceil((ex - 1) * 3))
		}
		setItemQuantity(vue.$data.series + 'RemotePS_Module' + str, a)
		if (vue.$data.series == 'TSx_') {
			setItemQuantity('TSx_RemoteIOBus_IM' + str, Math.ceil(a / 2 * 3))
		} else if (vue.$data.series == 'CX_') {
			//setItemQuantity('TSx_RemoteIOBus_IM'+str,Math.ceil(a/2*3))
			setItemQuantity('CX_ExChassis_CMJumper' + str, Math.ceil((a / 2 - 1) * 3))
		}
	}, 2)
	//远程系统电缆
	let remote_ETP_count = getAllRemoteETPQuantity(n)
	if (vue.$data.series == '') {
		setItemQuantity('RemoteELCO_Cable' + str, remote_ETP_count)
		setItemQuantity('RemoteELCO_Cable2' + str, 0)
	} else {
		setItemQuantity(vue.$data.series + 'RemoteIO_Cable' + str, remote_ETP_count)
		setItemQuantity(vue.$data.series + 'RemoteIO_Cable2' + str, 0)
	}
}

/**
 * 根据主产品ID查询产品包信息
 * @param {String} mainProductId - 主产品ID（productPackage__c的外键mainProduct__c）
 * @returns {Promise} 返回查询到的records数组
 */
var queryProductPackage = function (mainProductId) {
	return new Promise(function (resolve, reject) {
		if (!mainProductId) {
			resolve([]);
			return;
		}
		let param = {};
		param.xoql = "select id,name,quantity__c from productPackage__c where mainProduct__c=" + mainProductId;
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
//本地机架相关计算
var local_calc = function (remoteFlag) {
	if (vue.$data.enableAutoCalc == 'false') {
		return false;
	}
	getAllClick(remoteFlag).then(function (res) {
		if (res == 'success') {
			let m = getAll4703()
			if (vue.$data.series == 'CX_') {
				let sfp = 0
				if (m > 3) {
					setItemQuantity('IO_BusFiberSwitch', 3)
					setItemQuantity('CX_IOBus_FJumper2', 3)
					sfp = 3
				} else {
					setItemQuantity('IO_BusFiberSwitch', 0)
					setItemQuantity('CX_IOBus_FJumper2', 0)
					sfp = 0
				}
				setItemQuantity(vue.$data.series + 'IOBus_FJumper', m)
				setItemQuantity(vue.$data.series + 'IOBus_SFP', sfp * 2 + m)
			}

			let Master_RemoteChassis = Master_RemoteChassis_calc()
			if (vue.$data.series == '') {
				setItemQuantity(vue.$data.series + 'Master_RXMChassis', Master_RemoteChassis) //本地远程机架
				setItemQuantity(vue.$data.series + 'Master_CMRXM', Master_RemoteChassis * 3) //本地远程通讯卡
			}
			cascadeCalc();
			//这个地方为什么要有这个下面的逻辑？
			if (defaultQuantityArray.length > 0) {
				defaultQuantityArray.forEach(item => {
					if (item.item == vue.$data.series + 'Master_RXMChassis') {
						item.defaultQuantity = Master_RemoteChassis
					} else if (item.item == vue.$data.series + 'Master_CMRXM') {
						item.defaultQuantity = Master_RemoteChassis * 3
					} else if (item.item == vue.$data.series + 'Ex_Chassis') {
						item.defaultQuantity = 0
					}
				})
			}
			setTimeout(() => {
				let PS_Module = RemotePS_Module_Quantity_calc(vue.$data.series + 'Main_Chassis', vue.$data.series + 'Master_RXMChassis', vue.$data.series + 'Ex_Chassis')  //本地机架电源
				if (vue.$data.series == 'TSx_') {
					PS_Module = RemotePS_Module_Quantity_calc(vue.$data.series + 'Main_Chassis', vue.$data.series + 'Ex_Chassis')  //本地机架电源
				} else if (vue.$data.series == '') {
					PS_Module = RemotePS_Module_Quantity_calc(vue.$data.series + 'Main_Chassis', vue.$data.series + 'Master_RXMChassis', vue.$data.series + 'Ex_Chassis')  //本地机架电源
				} else {
					let ex = getItemQuantity(vue.$data.series + 'Ex_Chassis')
					let ps = getItemInfo('CX_PS_Module').wattage__c || 1
					PS_Module = (Math.ceil((6 + 8 * ex) * 24 / ps)) * 2
				}
				setItemQuantity(vue.$data.series + 'PS_Module', PS_Module)
				let Master_RemoteChassis_count = getItemQuantity(vue.$data.series + 'Master_RXMChassis')
				let Ex_Chassis_count = getItemQuantity(vue.$data.series + 'Ex_Chassis')
				let total = Master_RemoteChassis_count + Ex_Chassis_count
				setItemQuantity(vue.$data.series + 'IObus_Cable', total)  //本地I/O电缆
				if (vue.$data.series == 'CX_') {
					setItemQuantity(vue.$data.series + 'IOBus_RJ45Cable', Ex_Chassis_count * 3)
				}
				if (vue.$data.series == 'TSx_') {
					setItemQuantity('TSx_IOBus_IM', Math.ceil(PS_Module / 2 * 3))
					//单模跳线
					let sf_count = getAllSFJumper() //所有远程单模跳线
					setItemQuantity('TSx_IOBus_SFJumper', sf_count)
					//单模光模块
					setItemQuantity('TSx_IOBus_SFCM', sf_count)
				}
				BlankSlotPanel_calc() //机架空槽板（本地）
				//这个地方为什么要有这个下面的逻辑？
				if (defaultQuantityArray.length > 0) {
					defaultQuantityArray.forEach(item => {
						if (item.item == vue.$data.series + 'PS_Module') {
							item.defaultQuantity = (1 + 0 + Master_RemoteChassis) * 2
						} else if (item.item == vue.$data.series + 'IObus_Cable') {
							item.defaultQuantity = 0 + Master_RemoteChassis
						}
					})
				}
			}, 100)

			//系统电缆
			let etps_quantity = getAllLocalETPQuantity()
			if (vue.$data.series == '') {
				setItemQuantity('ELCO_Cable', etps_quantity)
				setItemQuantity('ELCO_Cable2', 0)
			} else {
				setItemQuantity(vue.$data.series + 'IO_Cable', etps_quantity)
				setItemQuantity(vue.$data.series + 'IO_Cable2', 0)
			}
		}
	})
}
//本地机架空槽板
var BlankSlotPanel_calc = function (p, val) {
	Ex_Chassis_Quantity_Calc()
	if (p == 'TSx_CPU') {
		if (val > 3) {
			val = 3
		} else if (val < 2) {
			val = 2
		}
		setItemQuantity('TSx_CPU', val)
	}
	if (p == vue.$data.series + 'CM_Module_Spec') {
		if (val > 2) {
			val = 2
		}
		setItemQuantity(vue.$data.series + 'CM_Module_Spec', val)
	}
	if (p == vue.$data.series + 'CM_Module') {
		if (val > 2) {
			val = 2
		} else if (val < 1) {
			val = 1
		}
		setItemQuantity(vue.$data.series + 'CM_Module', val)
	}
	setTimeout(function () {
		let cx_cm_module_spec = getItemQuantity(vue.$data.series + 'CM_Module_Spec')
		let cx_cm_module = getItemQuantity(vue.$data.series + 'CM_Module')
		let blank = Math.ceil(4 - cx_cm_module_spec - cx_cm_module)
		setItemQuantity(vue.$data.series + 'BlankSlotPanel1', blank)
	}, 1)


	let BlankSlotPanel_quantity = 0
	let CPU_quantity = getItemQuantity(vue.$data.series + 'CPU')
	let CM_Module_quantity = getItemQuantity(vue.$data.series + 'CM_Module')
	let Master_CMRemote_quantity = getItemQuantity(vue.$data.series + 'Master_CMRXM')
	let CM_Module_Spec = getItemQuantity(vue.$data.series + 'CM_Module_Spec')
	let Main_Chassis_quantity = getItemQuantity(vue.$data.series + 'Main_Chassis')
	let Master_RemoteChassis_quantity = getItemQuantity(vue.$data.series + 'Master_RXMChassis')
	let Ex_Chassis_quantity = getItemQuantity(vue.$data.series + 'Ex_Chassis')
	let all_localcard_count = getAllLocalCardQuantity()
	if (p == vue.$data.series + 'CPU') {
		CPU_quantity = val
	} else if (p == vue.$data.series + 'CM_Module_Spec') {
		if (val > 2) {
			CM_Module_Spec = 2
		} else {
			CM_Module_Spec = val
		}
	}
	let a = (Main_Chassis_quantity + Master_RemoteChassis_quantity + Ex_Chassis_quantity) * 16
	let b = CM_Module_quantity + Master_CMRemote_quantity + CM_Module_Spec
	BlankSlotPanel_quantity = (a - CPU_quantity - b - all_localcard_count) > 0 ? (a - CPU_quantity - b - all_localcard_count) : 0
	if (vue.$data.series != 'CX_') {
		setItemQuantity(vue.$data.series + 'BlankSlotPanel', BlankSlotPanel_quantity)
	} else {
		let m = 0
		m = getAllLocalCardQuantity()
		setItemQuantity(vue.$data.series + 'BlankSlotPanel', m)

		let n = 0
		if (getItemInfo(vue.$data.series + 'Ex_Chassis').slotCount__c) {
			n = Math.ceil(Ex_Chassis_quantity * getItemInfo(vue.$data.series + 'Ex_Chassis').slotCount__c - m)
		}
		setItemQuantity(vue.$data.series + 'BlankSlotPanel2', n)
	}
}

/**
 * 根据主产品ID查询产品包信息
 * @param {String} mainProductId - 主产品ID（productPackage__c的外键mainProduct__c）
 * @returns {Promise} 返回查询到的records数组
 */
var queryProductPackage = function (mainProductId) {
	return new Promise(function (resolve, reject) {
		if (!mainProductId) {
			resolve([]);
			return;
		}
		let param = {};
		param.xoql = "select id,name,quantity__c from productPackage__c where mainProduct__c=" + mainProductId;
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

/**
 *远程机架电源的计算
 * @constructor
 */
var RemotePS_Module_Quantity_calc = function () {  //第一个参数，电源，其他参数为机架名称
	let params = []
	let total = 0
	for (let i = 0; i < arguments.length; i++) {
		let a = getItemQuantity(arguments[i]) || 0
		params.push(a)
	}
	total = params.reduce((prev, curr) => {
		return prev + curr
	})
	return total * 2
}
/**
 *远程扩展机架数量的计算
 * @constructor
 */
var RemoteEx_Chassis_Count_Calc = function (i) {
	let Salve_RemoteChassis_Count = 0;
	let RemoteEx_Chassis_point = 0
	let allRemoteCardCount = getAllRemoteCardQuantity(i);
	let product = {};
	let slotCount = 0;
	if (i == 0) {
		if (vue.$data.series == '') {
			Salve_RemoteChassis_Count = getItemQuantity(vue.$data.series + "Salve_RemoteChassis");
			product = getItemInfo(vue.$data.series + "Salve_RemoteChassis");
			slotCount = product.slotCount__c;
		}
		RemoteEx_Chassis_point = getItemInfo(vue.$data.series + 'RemoteEx_Chassis').slotCount__c || 1
	} else if (i > 0) {
		if (vue.$data.series == '') {
			Salve_RemoteChassis_Count = getItemQuantity(vue.$data.series + "Salve_RemoteChassis#" + i);
			product = getItemInfo(vue.$data.series + "Salve_RemoteChassis#" + i);
			slotCount = product.slotCount__c;
		}
		RemoteEx_Chassis_point = getItemInfo(vue.$data.series + 'RemoteEx_Chassis#' + i).slotCount__c || 1
	}
	let RemoteEx_ChassisCount = (allRemoteCardCount - Salve_RemoteChassis_Count * slotCount);
	RemoteEx_ChassisCount = RemoteEx_ChassisCount < 0 ? 0 : RemoteEx_ChassisCount;
	if (RemoteEx_Chassis_point != 0) {
		RemoteEx_ChassisCount = Math.ceil(RemoteEx_ChassisCount / RemoteEx_Chassis_point);
	} else {
		RemoteEx_ChassisCount = 0
	}
	let str = i > 0 ? '#' + i : ''
	let exchassis_add = getItemValue(vue.$data.series + 'RemoteEx_ChassisADD' + str) || 0
	return Number.parseInt(RemoteEx_ChassisCount) + Number.parseInt(exchassis_add);
}

/**
 *远程机架/远程通讯卡 数量的计算  I/0 =0 时 为0，大于0时为1  单模跳线 单模光模块
 * @constructor
 */
var Salve_RemoteChassis_calc = function (n) {
	let Salve_RemoteChassis_Count = 0;
	let str = n > 0 ? '#' + n : ''
	let allRemoteCardCount = getAllRemoteCardQuantity(n);
	if (allRemoteCardCount > 0) {
		Salve_RemoteChassis_Count = 1
	}
	setItemQuantity(vue.$data.series + 'Salve_RemoteChassis' + str, Salve_RemoteChassis_Count)
	setItemQuantity(vue.$data.series + 'Slave_CMRemote' + str, Salve_RemoteChassis_Count * 3)
	if (vue.$data.series == 'TSx_') {
		if (allRemoteCardCount > 0) {
			setItemQuantity('TSx_RemoteIOBus_SFCM' + str, 3)
			setItemQuantity('TSx_RemoteIOBus_SFJumper' + str, 3)
		} else {
			setItemQuantity('TSx_RemoteIOBus_SFCM' + str, 0)
			setItemQuantity('TSx_RemoteIOBus_SFJumper' + str, 0)
		}
	}
	if (vue.$data.series == 'CX_') {
		setItemQuantity(vue.$data.series + 'IOBus_IMFFRemote' + str, Salve_RemoteChassis_Count * 3)
		setItemQuantity(vue.$data.series + 'RemoteIOBus_SFP' + str, Salve_RemoteChassis_Count * 3)
		setItemQuantity(vue.$data.series + 'RemoteIOBus_FJumper' + str, Salve_RemoteChassis_Count * 3)
	}
}

/**
 * 根据主产品ID查询产品包信息
 * @param {String} mainProductId - 主产品ID（productPackage__c的外键mainProduct__c）
 * @returns {Promise} 返回查询到的records数组
 */
var queryProductPackage = function (mainProductId) {
	return new Promise(function (resolve, reject) {
		if (!mainProductId) {
			resolve([]);
			return;
		}
		let param = {};
		param.xoql = "select id,name,quantity__c from productPackage__c where mainProduct__c=" + mainProductId;
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

/**
 *本地远程架数量的计算  Math.ceil(远程机架总数Salve_RemoteChassis/3)
 * @constructor
 */
var Master_RemoteChassis_calc = function () {
	let Master_RemoteChassis_count = 0
	if (vue.$data.series == '') {
		if (vue.$data.copyBlocks.length == 0) {
			Master_RemoteChassis_count = getItemQuantity(vue.$data.series + 'Salve_RemoteChassis')
		} else {
			let arr = []
			vue.$data.copyBlocks.forEach(item => {
				let n = 0
				n = Number(item.id.substring(item.id.length - 1))
				arr.push(getItemQuantity(vue.$data.series + 'Salve_RemoteChassis#' + n))
			})
			let a = arr.reduce((prev, curr) => {
				return prev + curr
			})
			a = a + getItemQuantity(vue.$data.series + 'Salve_RemoteChassis')
			Master_RemoteChassis_count = Math.ceil(a / 3)
		}
	}
	return Master_RemoteChassis_count
}
//默认就不可编辑的数值框
var defaultDisableArray = [];

var setDefaultDisable = function () {

	if (vue.$data.enableAutoCalc != 'false') {
		if (vue.$data.series != 'TSx_') {
			defaultDisableArray.push(vue.$data.series + "CPU");
		}
		defaultDisableArray.push(vue.$data.series + "Main_Chassis");
		defaultDisableArray.push(vue.$data.series + "Ex_Chassis");
		defaultDisableArray.push(vue.$data.series + "PS_Module");
		defaultDisableArray.push(vue.$data.series + "Master_CMRXM");
		defaultDisableArray.push(vue.$data.series + "Master_RXMChassis");
		defaultDisableArray.push(vue.$data.series + "IObus_Cable");
		defaultDisableArray.push(vue.$data.series + "BlankSlotPanel");
		if (vue.$data.series == 'CX_') {
			defaultDisableArray.push(vue.$data.series + "BlankSlotPanel1");
			defaultDisableArray.push(vue.$data.series + "BlankSlotPanel2");
			defaultDisableArray.push(vue.$data.series + "IOBus_IMSS")
			defaultDisableArray.push(vue.$data.series + "RemoteBlankSlotPanel2");
			defaultDisableArray.push(vue.$data.series + "RemoteIOBus_IMSS");
			defaultDisableArray.push(vue.$data.series + "IOBus_IMFFRemote");
			defaultDisableArray.push(vue.$data.series + "ExChassis_CMJumper");
			defaultDisableArray.push(vue.$data.series + "IOBus_IMSSRemote");
			defaultDisableArray.push('IO_BusFiberSwitch');
			defaultDisableArray.push(vue.$data.series + 'IOBus_FJumper2');
			defaultDisableArray.push(vue.$data.series + 'IOBus_RJ45Cable')
			defaultDisableArray.push(vue.$data.series + 'IOBus_SFP')
			defaultDisableArray.push(vue.$data.series + 'RemoteIOBus_SFP')
			defaultDisableArray.push(vue.$data.series + 'RemoteIOBus_RJ45Cable')
		}
		defaultDisableArray.push(vue.$data.series + "ELCO_Cable");
		defaultDisableArray.push(vue.$data.series + "Salve_RemoteChassis");
		defaultDisableArray.push(vue.$data.series + "RemoteEx_Chassis");
		defaultDisableArray.push(vue.$data.series + "RemoteIObus_Cable");
		defaultDisableArray.push(vue.$data.series + "RemoteBlankSlotPanel");
		defaultDisableArray.push(vue.$data.series + "RemotePS_Module");
		defaultDisableArray.push(vue.$data.series + "RemoteELCO_Cable");
		defaultDisableArray.push(vue.$data.series + "Slave_CMRemote");

		defaultDisableArray.forEach((name, index, array) => {
			if (vue.$data.itemApiKeys.hasOwnProperty(name)) {
				setNumDisable(name, true);
				name.deleted = true;
			}
		});
		defaultDisableArray = defaultDisableArray.filter(item => { return !item.deleted });

	}

}
//默认数量数组，只在界面加载时设定
var defaultQuantityArray = [];
var initDefaultQuantity = function () {
	if (vue.$data.enableAutoCalc != 'false') {
		defaultQuantityArray.push({ item: vue.$data.series + 'CPU', defaultQuantity: 3 });
		defaultQuantityArray.push({ item: vue.$data.series + 'CM_Module', defaultQuantity: 2 });
		defaultQuantityArray.push({ item: vue.$data.series + 'CM_Module_Spec', defaultQuantity: 0 });
		defaultQuantityArray.push({ item: vue.$data.series + 'Main_Chassis', defaultQuantity: 1 });
		defaultQuantityArray.push({ item: vue.$data.series + '1131', defaultQuantity: 1 });
		defaultQuantityArray.push({ item: vue.$data.series + 'PS_Module', defaultQuantity: 2 });
		defaultQuantityArray.push({ item: vue.$data.series + 'Master_RXMChassis', defaultQuantity: 0 });
		defaultQuantityArray.push({ item: vue.$data.series + 'Master_CMRXM', defaultQuantity: 0 });
		defaultQuantityArray.push({ item: vue.$data.series + 'Salve_RemoteChassis', defaultQuantity: 0 });
		defaultQuantityArray.push({ item: vue.$data.series + "Slave_CMRemote", defaultQuantity: 0 });
		defaultQuantityArray.push({ item: vue.$data.series + "Ex_Chassis", defaultQuantity: 0 });
		defaultQuantityArray.push({ item: vue.$data.series + "IObus_Cable", defaultQuantity: 0 });
		if (vue.$data.series != 'CX_') {
			defaultQuantityArray.push({ item: vue.$data.series + "BlankSlotPanel", defaultQuantity: 11 });
			defaultQuantityArray.push({ item: vue.$data.series + "IO_BusFiberSwitch", defaultQuantity: 0 });
		}
		defaultQuantityArray.push({ item: vue.$data.series + "Engineering&ProjMGT", defaultQuantity: 1 });
		if (vue.$data.series == 'TSx_') {
			defaultQuantityArray.push({ item: vue.$data.series + "RemoteIOBus_SFJumper", defaultQuantity: 0 });
			defaultQuantityArray.push({ item: vue.$data.series + "RemoteIOBus_SFCM", defaultQuantity: 0 });
		} else if (vue.$data.series == 'CX_') {
			defaultQuantityArray.push({ item: vue.$data.series + "BlankSlotPanel2", defaultQuantity: 0 });
			defaultQuantityArray.push({ item: vue.$data.series + 'BlankSlotPanel1', defaultQuantity: 2 });
		}
	}
}

/**
 * 根据主产品ID查询产品包信息
 * @param {String} mainProductId - 主产品ID（productPackage__c的外键mainProduct__c）
 * @returns {Promise} 返回查询到的records数组
 */
var queryProductPackage = function (mainProductId) {
	return new Promise(function (resolve, reject) {
		if (!mainProductId) {
			resolve([]);
			return;
		}
		let param = {};
		param.xoql = "select id,name,quantity__c from productPackage__c where mainProduct__c=" + mainProductId;
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
var setDefaultQuantity = function () {
	//只会设置一次
	if (vue.$data.enableAutoCalc != 'false') {
		defaultQuantityArray.forEach((defaultItem, index, array) => {
			if (vue.$data.itemApiKeys.hasOwnProperty(defaultItem.item)) {
				setItemQuantity(defaultItem.item, defaultItem.defaultQuantity);
				defaultItem.deleted = true;
			}
		});
		defaultQuantityArray = defaultQuantityArray.filter(item => { return !item.deleted });
	}

}
/**
 *
 * @returns {number}
 */
var getMpdLimits = function () {
	let days = 0;
	let configTypeId = vue.$data.configTypeId;
	let systemType = vue.$data.systemType;
	if (systemType) {
		if (systemType && (systemType == "SIS1" || systemType == "SIS2" || systemType == "SIS3")) {
			systemType = "SIS";
		} else if (systemType && (systemType == "TMC1" || systemType == "DEH" || systemType == "TMC2" || systemType == "iMEC")) {
			systemType = "CCS";
		}
		for (let i = 0; i < vue.$data.mpdLimits.length; i++) {
			let limit = vue.$data.mpdLimits[i];
			if ((configTypeId == limit.configType) && (systemType == limit.systemType)) {
				if (systemType == "CCS") {
					let cardPoints = ioCount("countPerCard");
					if (limit.ioCount && limit.ioCount > cardPoints) {
						days = limit.limitDays;
						break;
					}
				} else {
					days = limit.limitDays;
					break;
				}
			}
		}
	}
	return days;
}
/**
 * 获取开工会最下限制
 * @returns {number}
 */
var getTCMLimits = function () {
	let projectType = vue.$data.projectType;
	let configTypeId = vue.$data.configTypeId;
	let days = 0;
	if (projectType == '改造') {
		for (let i = 0; i < vue.$data.mpdLimits.length; i++) {
			let limit = vue.$data.mpdLimits[i];
			if ((configTypeId == limit.configType)) {
				days = limit.limitDays;
				break;
			}
		}
	}
	return days;
}

/**
 * @param {Object} itemName 根据ItemName获取对应配置项当前值
 */
var getItemValue = function (itemName) {
	let key = vue.$data.itemApiKeys[itemName];
	if (key == undefined) {
		return 0
	} else {
		return vue.$data.itemValues[key];
	}
}

/**
 * 根据主产品ID查询产品包信息
 * @param {String} mainProductId - 主产品ID（productPackage__c的外键mainProduct__c）
 * @returns {Promise} 返回查询到的records数组
 */
var queryProductPackage = function (mainProductId) {
	return new Promise(function (resolve, reject) {
		if (!mainProductId) {
			resolve([]);
			return;
		}
		let param = {};
		param.xoql = "select id,name,quantity__c from productPackage__c where mainProduct__c=" + mainProductId;
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
/**
 * 根据ItemName设置对应配置项的value
 * @param itemName
 * @param value
 */
var setItemValue = function (itemName, value) {
	let key = vue.$data.itemApiKeys[itemName];
	vue.$set(vue.$data.itemValues, key, value);
}
/**
 * 根据itemName获取对应配置项的数量值
 * @param itemName
 * @returns {number|*}
 */
var getItemQuantity = function (itemName) {
	if (vue.$data.itemApiKeys.hasOwnProperty(itemName)) {
		let key = vue.$data.itemApiKeys[itemName];
		key = key.replace(/itemValue/, "itemQuantityValue");
		return vue.$data.itemQuantityValues[key] == undefined ? 0 : Number(vue.$data.itemQuantityValues[key])
	} else {
		return 0;
	}
}

/**
 * 根据主产品ID查询产品包信息
 * @param {String} mainProductId - 主产品ID（productPackage__c的外键mainProduct__c）
 * @returns {Promise} 返回查询到的records数组
 */
var queryProductPackage = function (mainProductId) {
	return new Promise(function (resolve, reject) {
		if (!mainProductId) {
			resolve([]);
			return;
		}
		let param = {};
		param.xoql = "select id,name,quantity__c from productPackage__c where mainProduct__c=" + mainProductId;
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
/**
 * @param {Object} itemName 根据ItemName获取对应配置项当前值
 */
var getItemInfo = function (itemName) {   //val2:根据已知value查info
	if (!vue.$data.itemApiKeys[itemName] || vue.$data.itemApiKeys[itemName] == undefined) {
		return { slotCount__c: 0 }
	}
	let key = vue.$data.itemApiKeys[itemName];
	let blockId = key.split("::")[1];
	let itemId = key.split("::")[2];
	key = 'configItemDataSource_' + blockId + '_' + itemId
	let selectValue = getItemValue(itemName)
	if (Array.isArray(selectValue)) {
		let p = {};
		//说明是transfer,则需要逐个的遍历获取
		selectValue.forEach(s => {
			if (vue.$data.selectItemDataSource[key] && vue.$data.selectItemDataSource[key].length) {
				let a = vue.$data.selectItemDataSource[key].filter(item => {
					return item.value == s
				});
				if (a[0] && a[0]['productInfo']) {
					p[s] = a[0]['productInfo'];
				}
			}
		});
		return p;
	} else {
		if (vue.$data.selectItemDataSource[key] && vue.$data.selectItemDataSource[key].length) {
			let a = vue.$data.selectItemDataSource[key].filter(item => {
				return item.value == selectValue
			});
			return (a && a[0] && a[0].productInfo) ? a[0].productInfo : {};
		}
	}

}
/**
 * 根据itemName设置对应配置的数量值
 * @param itemName
 * @param quantity
 */
var setItemQuantity = function (itemName, quantity) {
	if (vue.$data.itemApiKeys.hasOwnProperty(itemName)) {
		let key = vue.$data.itemApiKeys[itemName];
		key = key.replace(/itemValue/, "itemQuantityValue");
		vue.$set(vue.$data.itemQuantityValues, key, quantity);
		vue.$nextTick(() => {
			vue.$set(vue.$data.itemQuantityValues, key, quantity);
		})
	}
}

/**
 * 根据主产品ID查询产品包信息
 * @param {String} mainProductId - 主产品ID（productPackage__c的外键mainProduct__c）
 * @returns {Promise} 返回查询到的records数组
 */
var queryProductPackage = function (mainProductId) {
	return new Promise(function (resolve, reject) {
		if (!mainProductId) {
			resolve([]);
			return;
		}
		let param = {};
		param.xoql = "select id,name,quantity__c from productPackage__c where mainProduct__c=" + mainProductId;
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
var getConfigItem = function (itemName) {
	if (vue.$data.configItemRecords.hasOwnProperty(itemName)) {
		return vue.$data.configItemRecords[itemName];
	}
	return undefined;
}

var setError = function (itemName, text) {
	if (vue.$data.itemApiKeys.hasOwnProperty(itemName)) {
		let key = vue.$data.itemApiKeys[itemName];
		key = key.replace(/itemValue/, "itemError");
		vue.$set(vue.$data.itemError, key, text)
	}
}

/**
 * 根据主产品ID查询产品包信息
 * @param {String} mainProductId - 主产品ID（productPackage__c的外键mainProduct__c）
 * @returns {Promise} 返回查询到的records数组
 */
var queryProductPackage = function (mainProductId) {
	return new Promise(function (resolve, reject) {
		if (!mainProductId) {
			resolve([]);
			return;
		}
		let param = {};
		param.xoql = "select id,name,quantity__c from productPackage__c where mainProduct__c=" + mainProductId;
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
//设置输入框是否禁用
var setNumDisable = function (itemName, val) {
	if (val) {
		if (vue.$data.disables.indexOf(itemName) == -1) {
			vue.$data.disables.push(itemName)
		}
	} else {
		if (vue.$data.disables.indexOf(itemName) != -1) {
			let a = vue.$data.disables.indexOf(itemName)
			vue.$data.disables.splice(a, 1)
		}
	}

}

/**
 * 查询关联关系
 */
var queryRefrenceRelationShip = function () {
	debugger;
	var typeId = vue.$data.configTypeId;
	var config = {
		method: 'get',
		url: '/rest/data/v2.0/scripts/api/neocrm/bom/query/item/reference?typeId=' + typeId,
		contentType: 'application/json'
	};
	showLoading();
	lapp.connection.invoke(config)
		.then(function (response) {
			if (response.data && response.status === 200) {
				var records = response.data;
				vue.$data.refrenceMap = records;
			}
			hideLoading();
		})
		.catch(function (error) {
			hideLoading();
			vue.$message.error("查询关联关系发生异常:" + error);
		});
}
/**
 * 当自定义数据源的下拉选项框的选中项发生改变时，调用这个方法
 */
var customDataSourceItemRefrenceChange = function (value, blockId, item) {

	return new Promise((resolve, reject) => {

		if (item.customizeDataSource__c != null && item.customizeDataSource__c != '') {
			//当自定义数据源的控件触发change事件时触发所在区块的控件使用了该组件值的下拉选择重新加载数据源
			if (item.name.indexOf("Remote") > -1 || item.name.indexOf("remote") > -1) {
				let itemsArray = vue.$data.configItems["configitem_" + blockId];
				refreshDependenceItem(itemsArray, item);
			} else {
				for (key in vue.$data.configItems) {
					let itemsArray = vue.$data.configItems[key];
					refreshDependenceItem(itemsArray, item);
				}
			}

		}
	})

}

var refreshDependenceItem = function (itemsArray, item) {
	let reg = new RegExp("#(.*?)#", "gi");
	let interval = 1;
	let count = 1;
	itemsArray.forEach(function (itemArray) {
		itemArray.forEach(function (record) {
			if (record.dataSourceUrl__c && record.dataSourceUrl__c != '' && record.dataSourceUrl__c.indexOf("https") > -1) {
				if (record.dataSourceUrl__c.search(reg) > 0) {
					let newName = item.name;
					let copyNum = undefined;
					let currentCopyNum = undefined;
					if (item.name.indexOf("#") > 0) {
						newName = item.name.split("#")[0];
						copyNum = item.name.split("#")[1];
					}
					//url中包含了item.name 说明是要基于item变更下拉框数据源的
					if (record.dataSourceUrl__c.indexOf(newName) > -1) {
						//每10个请求就向后延迟1.5秒避免出现高频并发
						if (count % 10 == 0) {
							interval = interval + 1;
						}
						let url = record.dataSourceUrl__c;
						let jump = false;
						if (record.name.indexOf("#") > 0) {
							currentCopyNum = record.name.split("#")[1];
							if (copyNum != undefined && currentCopyNum != undefined && copyNum != currentCopyNum) {
								jump = true;//当都是拷贝出来的远程配置 时只加载当前远程即可
							}
							//说明是复制的远程配置项。
							let tempName = item.name.replaceAll("#", "@@");
							url = record.dataSourceUrl__c.replaceAll(newName, tempName);
						}
						if (!jump) {
							queryDataSource(url, record.confiurationBlockId__c, record.id, record.isCasecade__c, record.multiSelect__c, record.componmentType__c, record.defaultValue).then(function (refrenceItemInMap) {
								setTimeout(function () {
									refrenceItemChange(refrenceItemInMap).then(res => {
										if (res == true) {
											resolve(true)
										} else {
											resolve(false)
										}
									}).catch(err => {
										reject(err)
									});
								}, 1000);
							});
						}

					}

				}
			}
		});

	});
}
/**
 * 对关联依赖项按照url进行分组
 * @param item
 */
var getRefrenceItemsInUrlMap = function (item, value) {
	let urlGroup = {};//按照url进行分组。同一个url的放入到一个组里面
	if (vue.$data.refrenceMap.hasOwnProperty(item.id)) {
		let itemAry = vue.$data.refrenceMap[item.id];
		//当多个配置项依赖于同一个配置项时，如果配置项没有自己的特殊参数设定，那么他们请求的数据都是一样的。没有必要每个配置项都发起请求。
		itemAry.forEach(function (record) {
			let url = "/rest/data/v2.0/scripts/api/neocrm/bom/query/product/reference?referenceCode=" + encodeURIComponent(value) + "&userId=" + getQueryString("userId");
			if (record.dataSourceUrl__c != null && record.dataSourceUrl__c != '') {
				url += "&param=" + record.dataSourceUrl__c;
			}
			if (urlGroup.hasOwnProperty(url)) {
				urlGroup[url].push(record);
			} else {
				urlGroup[url] = new Array(record);
			}
		});
	}
	return urlGroup;
}
/**
 * 当非自定义数据源的下拉选项框的选中项发生改变时，调用这个方法.
 * urlGroup是按URL分组，这样减少请求次数。
 */
var refrenceItemChange = function (urlGroup) {
	return new Promise((resolve, reject) => {
		for (var turl in urlGroup) {
			let records = urlGroup[turl];//使用同一个url的配置项的集合
			turl = urlLocalParamProcess(turl);//针对配置中包含了#xxxx#的配置参数进行替换处理
			var config = {
				method: 'get',
				url: turl,
				contentType: 'application/json'
			};
			lapp.connection.invoke(config)
				.then(function (response) {
					if (response.data && response.status === 200) {
						//请求回来的结果分别赋值给相关联的组件
						records.forEach(function (record) {
							vue.$set(vue.$data.selectItemDataSource, "configItemDataSource_" + record.confiurationBlockId__c + "_" + record.id, response.data.dataSource)
							vue.$set(vue.$data.selectItemDataSourceNew, "configItemDataSource_" + record.confiurationBlockId__c + "_" + record.id, response.data.dataSource)
							let valueKey = "itemValue::" + record.confiurationBlockId__c + "::" + record.id;
							if (response.data.defaultValue && response.data.defaultValue != '') {
								vue.$set(vue.$data.itemValues, valueKey, response.data.defaultValue);
							} else {
								//vue.$set(vue.$data.itemValues,valueKey,record.primaryProductCode__c);
								//数据源发生变更时清理原来的值,设置为初始状态
								vue.$set(vue.$data.itemValues, valueKey, "");
							}
						});
						resolve(true)
					} else {
						resolve(false)
					}
				}).catch(function (e) {
					console.log("关联加载异常" + e.message);
					reject(e)
					if (e.message.indexOf("429") > -1) {
						setTimeout(function () {
							refrenceItemChange(urlGroup);
						}, 2000);
					}

				});
		}
	})

}
/**
 * 获取所有本地卡件数量
 * @returns {*}
 */
var getAllLocalCardQuantity = function () {
	let DI_Module_Quqntity = Number.isInteger(getItemQuantity(vue.$data.series + "DI_Module")) ? getItemQuantity(vue.$data.series + "DI_Module") : 0;
	let DI_Module2_Quqntity = Number.isInteger(getItemQuantity(vue.$data.series + "DI_Module2")) ? getItemQuantity(vue.$data.series + "DI_Module2") : 0;
	let DO_Module_Quqntity = Number.isInteger(getItemQuantity(vue.$data.series + "DO_Module")) ? getItemQuantity(vue.$data.series + "DO_Module") : 0;
	let DO_Module2_Quqntity = Number.isInteger(getItemQuantity(vue.$data.series + "DO_Module2")) ? getItemQuantity(vue.$data.series + "DO_Module2") : 0;
	let AI_Module_Quqntity = Number.isInteger(getItemQuantity(vue.$data.series + "AI_Module")) ? getItemQuantity(vue.$data.series + "AI_Module") : 0;
	let AI_Module2_Quqntity = Number.isInteger(getItemQuantity(vue.$data.series + "AI_Module2")) ? getItemQuantity(vue.$data.series + "AI_Module2") : 0;
	let AO_Module_Quqntity = Number.isInteger(getItemQuantity(vue.$data.series + "AO_Module")) ? getItemQuantity(vue.$data.series + "AO_Module") : 0;
	let AO_Module2_Quqntity = Number.isInteger(getItemQuantity(vue.$data.series + "AO_Module2")) ? getItemQuantity(vue.$data.series + "AO_Module2") : 0;
	let PI_Module_Quqntity = Number.isInteger(getItemQuantity(vue.$data.series + "PI_Module")) ? getItemQuantity(vue.$data.series + "PI_Module") : 0;
	let PI_Module2_Quantity = 0
	let VM_Module_Quantity = 0
	let SM_Module_Quantity = 0
	let UIO_Module_Quantity = 0
	let UIO_Module2_Quantity = 0
	if (vue.$data.series == 'TSx_') {
		PI_Module2_Quantity = Number.isInteger(getItemQuantity(vue.$data.series + "PI_Module2")) ? getItemQuantity(vue.$data.series + "PI_Module2") : 0;
		VM_Module_Quantity = Number.isInteger(getItemQuantity(vue.$data.series + "VM_Module")) ? getItemQuantity(vue.$data.series + "VM_Module") : 0;
		SM_Module_Quantity = Number.isInteger(getItemQuantity(vue.$data.series + "SM_Module")) ? getItemQuantity(vue.$data.series + "SM_Module") : 0;
	} else if (vue.$data.series == 'CX_') {
		UIO_Module_Quantity = Number.isInteger(getItemQuantity(vue.$data.series + "UIO_Module")) ? getItemQuantity(vue.$data.series + "UIO_Module") : 0
		UIO_Module2_Quantity = Number.isInteger(getItemQuantity(vue.$data.series + "UIO_Module2")) ? getItemQuantity(vue.$data.series + "UIO_Module2") : 0
	}
	let allCardQuantity = DI_Module_Quqntity + DI_Module2_Quqntity + DO_Module_Quqntity +
		DO_Module2_Quqntity + AI_Module_Quqntity + AI_Module2_Quqntity + AO_Module_Quqntity +
		AO_Module2_Quqntity + PI_Module_Quqntity + PI_Module2_Quantity + VM_Module_Quantity + SM_Module_Quantity +
		UIO_Module_Quantity + UIO_Module2_Quantity
	return allCardQuantity;
}
//获取远端卡件数量，根据序号不同分别获取。如果序号为0则认为是第一个  单个远端
var getAllRemoteCardQuantity = function (index) {
	let lastStr = ''
	lastStr = index > 0 ? '#' + index : ''
	let DI_Module_Quqntity = Number.isInteger(getItemQuantity(vue.$data.series + "RemoteDI_Module" + lastStr)) ? getItemQuantity(vue.$data.series + "RemoteDI_Module" + lastStr) : 0;
	let DI_Module2_Quqntity = Number.isInteger(getItemQuantity(vue.$data.series + "RemoteDI_Module2" + lastStr)) ? getItemQuantity(vue.$data.series + "RemoteDI_Module2" + lastStr) : 0;
	let DO_Module_Quqntity = Number.isInteger(getItemQuantity(vue.$data.series + "RemoteDO_Module" + lastStr)) ? getItemQuantity(vue.$data.series + "RemoteDO_Module" + lastStr) : 0;
	let DO_Module2_Quqntity = Number.isInteger(getItemQuantity(vue.$data.series + "RemoteDO_Module2" + lastStr)) ? getItemQuantity(vue.$data.series + "RemoteDO_Module2" + lastStr) : 0;
	let AI_Module_Quqntity = Number.isInteger(getItemQuantity(vue.$data.series + "RemoteAI_Module" + lastStr)) ? getItemQuantity(vue.$data.series + "RemoteAI_Module" + lastStr) : 0;
	let AI_Module2_Quqntity = Number.isInteger(getItemQuantity(vue.$data.series + "RemoteAI_Module2" + lastStr)) ? getItemQuantity(vue.$data.series + "RemoteAI_Module2" + lastStr) : 0;
	let AO_Module_Quqntity = Number.isInteger(getItemQuantity(vue.$data.series + "RemoteAO_Module" + lastStr)) ? getItemQuantity(vue.$data.series + "RemoteAO_Module" + lastStr) : 0;
	let AO_Module2_Quqntity = Number.isInteger(getItemQuantity(vue.$data.series + "RemoteAO_Module2" + lastStr)) ? getItemQuantity(vue.$data.series + "RemoteAO_Module2" + lastStr) : 0;
	let PI_Module_Quqntity = Number.isInteger(getItemQuantity(vue.$data.series + "RemotePI_Module" + lastStr)) ? getItemQuantity(vue.$data.series + "RemotePI_Module" + lastStr) : 0;
	let PI_Module2_Quqntity = 0
	let VM_Module_Quantity = 0
	let SM_Module_Quantity = 0
	let UIO_Module_Quantity = 0
	let UIO_Module2_Quantity = 0
	if (vue.$data.series == 'TSx_') {
		PI_Module2_Quqntity = Number.isInteger(getItemQuantity(vue.$data.series + "RemotePI_Module2" + lastStr)) ? getItemQuantity(vue.$data.series + "RemotePI_Module2" + lastStr) : 0;
		VM_Module_Quantity = Number.isInteger(getItemQuantity(vue.$data.series + "RemoteVM_Module" + lastStr)) ? getItemQuantity(vue.$data.series + "RemoteVM_Module" + lastStr) : 0;
		SM_Module_Quantity = Number.isInteger(getItemQuantity(vue.$data.series + "RemoteSM_Module" + lastStr)) ? getItemQuantity(vue.$data.series + "RemoteSM_Module" + lastStr) : 0;
	} else if (vue.$data.series == 'CX_') {
		UIO_Module_Quantity = Number.isInteger(getItemQuantity(vue.$data.series + "RemoteUIO_Module" + lastStr)) ? getItemQuantity(vue.$data.series + "RemoteUIO_Module" + lastStr) : 0
		UIO_Module2_Quantity = Number.isInteger(getItemQuantity(vue.$data.series + "RemoteUIO_Module2" + lastStr)) ? getItemQuantity(vue.$data.series + "RemoteUIO_Module2" + lastStr) : 0
	}
	let allCardQuantity = DI_Module_Quqntity + DI_Module2_Quqntity + DO_Module_Quqntity + DO_Module2_Quqntity + AI_Module_Quqntity + AI_Module2_Quqntity + AO_Module_Quqntity + AO_Module2_Quqntity + PI_Module_Quqntity + PI_Module2_Quqntity + VM_Module_Quantity + SM_Module_Quantity + UIO_Module_Quantity + UIO_Module2_Quantity;
	return allCardQuantity;
}
//获取所有远端I/O卡件数量
var getAllRemoteCardCount = function () {
	let count = getAllRemoteCardQuantity(0)
	let a = 0
	if (vue.$data.copyBlocks.length > 0) {
		vue.$data.copyBlocks.forEach(item => {
			let n = Number(item.id.substring(item.id.length - 1))
			a += getAllRemoteCardQuantity(n)
		})
	}
	count = count + a
	return count;
}
var getAllSFJumper = function () {
	let count = getItemQuantity('TSx_RemoteIOBus_SFJumper')
	let a = 0
	if (vue.$data.copyBlocks.length > 0) {
		vue.$data.copyBlocks.forEach(item => {
			let n = Number(item.id.substring(item.id.length - 1))
			a += getItemQuantity('TSx_RemoteIOBus_SFJumper#' + n)
		})
	}
	count = count + a
	return count;
}
/**
 * 获取所有本地端子板数量
 * @returns {*}
 */
var getAllLocalETPQuantity = function () {
	let PI_ETP_quantity = Number.isInteger(getItemQuantity(vue.$data.series + "PI_ETP")) ? getItemQuantity(vue.$data.series + "PI_ETP") : 0
	let PI_ETP2_quantity = 0
	let VM_ETP_quantity = 0
	let SM_ETP_quantity = 0
	let UIO_ETP_quantity = 0
	let UIO_ETP1_quantity = 0
	let UIO_ETP2_quantity = 0
	let OSP_ETP_quantity = 0
	if (vue.$data.series == 'TSx_') {
		PI_ETP2_quantity = Number.isInteger(getItemQuantity(vue.$data.series + "PI_ETP2")) ? getItemQuantity(vue.$data.series + "PI_ETP2") : 0
		VM_ETP_quantity = Number.isInteger(getItemQuantity(vue.$data.series + "VM_ETP")) ? getItemQuantity(vue.$data.series + "VM_ETP") : 0
		SM_ETP_quantity = Number.isInteger(getItemQuantity(vue.$data.series + "SM_ETP")) ? getItemQuantity(vue.$data.series + "SM_ETP") : 0
		OSP_ETP_quantity = Number.isInteger(getItemQuantity(vue.$data.series + "OSP_ETP")) ? getItemQuantity(vue.$data.series + "OSP_ETP") : 0
	} else if (vue.$data.series == 'CX_') {
		UIO_ETP_quantity = Number.isInteger(getItemQuantity(vue.$data.series + "UIO_ETP")) ? getItemQuantity(vue.$data.series + "UIO_ETP") : 0
		UIO_ETP1_quantity = Number.isInteger(getItemQuantity(vue.$data.series + "UIO_ETP1")) ? getItemQuantity(vue.$data.series + "UIO_ETP1") : 0
		UIO_ETP2_quantity = Number.isInteger(getItemQuantity(vue.$data.series + "UIO_ETP2")) ? getItemQuantity(vue.$data.series + "UIO_ETP2") : 0
	}
	let arr = ['DI', 'DO', 'AI', 'AO']
	let etps = []
	let allETPQuantity = 0
	arr.forEach(item => {
		let a = 0
		let b = 0
		let c = 0
		a = Number.isInteger(getItemQuantity(vue.$data.series + item + '_ETP')) ? getItemQuantity(vue.$data.series + item + '_ETP') : 0
		b = Number.isInteger(getItemQuantity(vue.$data.series + item + '_ETP1')) ? getItemQuantity(vue.$data.series + item + '_ETP1') : 0
		c = Number.isInteger(getItemQuantity(vue.$data.series + item + '_ETP2')) ? getItemQuantity(vue.$data.series + item + '_ETP2') : 0
		if (item == 'AI' && vue.$data.series == 'TSx_') {
			let pq = getItemInfo(vue.$data.series + item + '_ETP')
			if (pq.subSignalType__c && pq.subSignalType__c.length > 0 && pq.subSignalType__c[0] == '2ELCO') {
				a = Number.isInteger(getItemQuantity(vue.$data.series + item + '_ETP')) ? 2 * getItemQuantity(vue.$data.series + item + '_ETP') : 0
			}
			let pq1 = getItemInfo(vue.$data.series + item + '_ETP1')
			if (pq1.subSignalType__c && pq1.subSignalType__c.length > 0 && pq1.subSignalType__c[0] == '2ELCO') {
				b = Number.isInteger(getItemQuantity(vue.$data.series + item + '_ETP1')) ? 2 * getItemQuantity(vue.$data.series + item + '_ETP1') : 0
			}
			let pq2 = getItemInfo(vue.$data.series + item + '_ETP2')
			if (pq2.subSignalType__c && pq2.subSignalType__c.length > 0 && pq2.subSignalType__c[0] == '2ELCO') {
				c = Number.isInteger(getItemQuantity(vue.$data.series + item + '_ETP2')) ? 2 * getItemQuantity(vue.$data.series + item + '_ETP2') : 0
			}
		} else if (item == 'AO' && vue.$data.series == '') {
			let mq = getItemInfo(vue.$data.series + item + '_ETP')
			let mq1 = getItemInfo(vue.$data.series + item + '_ETP1')
			let mq2 = getItemInfo(vue.$data.series + item + '_ETP2')
			if ((mq.subSignalType__c && mq.subSignalType__c.length > 0 && mq.subSignalType__c[0] == '2ELCO') ||
				(mq1.subSignalType__c && mq1.subSignalType__c.length > 0 && mq1.subSignalType__c[0] == '2ELCO') ||
				(mq2.subSignalType__c && mq2.subSignalType__c.length > 0 && mq2.subSignalType__c[0] == '2ELCO')) {
				a = getItemQuantity(vue.$data.series + item + '_Module')
				b = getItemQuantity(vue.$data.series + item + '_Module2')
				c = 0
			}
		}
		etps.push(a, b, c)
	})
	let etps_quantity = etps.reduce((prev, curr) => {
		return prev + curr
	})
	allETPQuantity = PI_ETP_quantity + PI_ETP2_quantity + VM_ETP_quantity + SM_ETP_quantity + etps_quantity + UIO_ETP_quantity + UIO_ETP1_quantity + UIO_ETP2_quantity + OSP_ETP_quantity
	return allETPQuantity
}
//获取远端端子板数量，根据序号不同分别获取。如果序号为0则认为是第一个  单个远端
var getAllRemoteETPQuantity = function (index) {
	let lastStr = ''
	lastStr = index > 0 ? '#' + index : ''
	let PI_ETP_quantity = Number.isInteger(getItemQuantity(vue.$data.series + "RemotePI_ETP" + lastStr)) ? getItemQuantity(vue.$data.series + "RemotePI_ETP" + lastStr) : 0
	let PI_ETP2_quantity = 0
	let VM_ETP_quantity = 0
	let SM_ETP_quantity = 0
	let UIO_ETP_quantity = 0
	let UIO_ETP1_quantity = 0
	let UIO_ETP2_quantity = 0
	let OSP_ETP_quantity = 0
	if (vue.$data.series == 'TSx_') {
		PI_ETP2_quantity = Number.isInteger(getItemQuantity(vue.$data.series + "RemotePI_ETP2" + lastStr)) ? getItemQuantity(vue.$data.series + "RemotePI_ETP2" + lastStr) : 0
		VM_ETP_quantity = Number.isInteger(getItemQuantity(vue.$data.series + "RemoteVM_ETP" + lastStr)) ? getItemQuantity(vue.$data.series + "RemoteVM_ETP" + lastStr) : 0
		SM_ETP_quantity = Number.isInteger(getItemQuantity(vue.$data.series + "RemoteSM_ETP" + lastStr)) ? getItemQuantity(vue.$data.series + "RemoteSM_ETP" + lastStr) : 0
		OSP_ETP_quantity = Number.isInteger(getItemQuantity(vue.$data.series + "RemoteOSP_ETP" + lastStr)) ? getItemQuantity(vue.$data.series + "RemoteOSP_ETP" + lastStr) : 0
	} else if (vue.$data.series == 'CX_') {
		UIO_ETP_quantity = Number.isInteger(getItemQuantity(vue.$data.series + "RemoteUIO_ETP" + lastStr)) ? getItemQuantity(vue.$data.series + "RemoteUIO_ETP" + lastStr) : 0
		UIO_ETP1_quantity = Number.isInteger(getItemQuantity(vue.$data.series + "RemoteUIO_ETP1" + lastStr)) ? getItemQuantity(vue.$data.series + "RemoteUIO_ETP1" + lastStr) : 0
		UIO_ETP2_quantity = Number.isInteger(getItemQuantity(vue.$data.series + "RemoteUIO_ETP2" + lastStr)) ? getItemQuantity(vue.$data.series + "RemoteUIO_ETP2" + lastStr) : 0
	}
	let arr = ['RemoteDI', 'RemoteDO', 'RemoteAI', 'RemoteAO']
	let etps = []
	let allETPQuantity = 0
	arr.forEach(item => {
		let a = 0
		let b = 0
		let c = 0
		a = Number.isInteger(getItemQuantity(vue.$data.series + item + '_ETP' + lastStr)) ? getItemQuantity(vue.$data.series + item + '_ETP' + lastStr) : 0
		b = Number.isInteger(getItemQuantity(vue.$data.series + item + '_ETP1' + lastStr)) ? getItemQuantity(vue.$data.series + item + '_ETP1' + lastStr) : 0
		c = Number.isInteger(getItemQuantity(vue.$data.series + item + '_ETP2' + lastStr)) ? getItemQuantity(vue.$data.series + item + '_ETP2' + lastStr) : 0
		if (item == 'RemoteAI' && vue.$data.series == 'TSx_') {
			let aa = getItemInfo(vue.$data.series + item + '_ETP' + lastStr)
			if (aa.subSignalType__c && aa.subSignalType__c > 0 && aa.subSignalType__c[0] == '2ELCO') {
				a = Number.isInteger(getItemQuantity(vue.$data.series + item + '_ETP' + lastStr)) ? 2 * getItemQuantity(vue.$data.series + item + '_ETP' + lastStr) : 0
			}
			let bb = getItemInfo(vue.$data.series + item + '_ETP1' + lastStr)
			if (bb.subSignalType__c && bb.subSignalType__c.length > 0 && bb.subSignalType__c[0] == '2ELCO') {
				b = Number.isInteger(getItemQuantity(vue.$data.series + item + '_ETP1' + lastStr)) ? 2 * getItemQuantity(vue.$data.series + item + '_ETP1' + lastStr) : 0
			}
			let cc = getItemInfo(vue.$data.series + item + '_ETP2' + lastStr)
			if (cc.subSignalType__c && cc.subSignalType__c.length > 0 && cc.subSignalType__c[0] == '2ELCO') {
				c = Number.isInteger(getItemQuantity(vue.$data.series + item + '_ETP2' + lastStr)) ? 2 * getItemQuantity(vue.$data.series + item + '_ETP2' + lastStr) : 0
			}
		} else if (item == 'RemoteAO' && vue.$data.series == '') {
			let mq = getItemInfo(vue.$data.series + item + '_ETP' + lastStr)
			let mq1 = getItemInfo(vue.$data.series + item + '_ETP1' + lastStr)
			let mq2 = getItemInfo(vue.$data.series + item + '_ETP2' + lastStr)
			if ((mq.subSignalType__c && mq.subSignalType__c.length > 0 && mq.subSignalType__c[0] == '2ELCO') ||
				(mq1.subSignalType__c && mq1.subSignalType__c.length > 0 && mq1.subSignalType__c[0] == '2ELCO') ||
				(mq2.subSignalType__c && mq2.subSignalType__c.length > 0 && mq2.subSignalType__c[0] == '2ELCO')) {
				a = getItemQuantity(vue.$data.series + item + '_Module' + lastStr)
				b = getItemQuantity(vue.$data.series + item + '_Module2' + lastStr)
				c = 0
			}
		}
		etps.push(a, b, c)
	})
	let etps_quantity = etps.reduce((prev, curr) => {
		return prev + curr
	})
	allETPQuantity = PI_ETP_quantity + PI_ETP2_quantity + etps_quantity + VM_ETP_quantity + SM_ETP_quantity + UIO_ETP_quantity + UIO_ETP1_quantity + UIO_ETP2_quantity + OSP_ETP_quantity
	return allETPQuantity
}
/**
 * @param {Object} 采用同步方式获取物料数据
 */
var queryProductInfo = function (code) {
	return new Promise((resolve, reject) => {
		let product = {};
		product = getItemInfo(code) || {}
		if (product.slotCount__c == undefined) {
			product.slotCount__c = 0
		}
		resolve(product)
	})
}

//针对url中包含#xxxx#的参数进行处理。
var urlLocalParamProcess = function (url) {
	let reg = new RegExp("#(.*?)#", "gi");
	if (url.search(reg) > 0) {
		let localParamValue = url.match(reg);
		if (localParamValue.length > 0) {
			localParamValue.forEach(function (paramValue) {
				let temp = paramValue;
				let paramValueName = paramValue.replace(/#/g, "")
				if (paramValueName.indexOf("@@") > -1) {
					paramValueName = paramValueName.replaceAll("@@", "#");
				}
				let realParamValue = getItemValue(paramValueName);
				if (realParamValue != null && realParamValue != undefined) {
					realParamValue = encodeURIComponent(realParamValue);
					url = url.replace(temp, realParamValue);
				} else {
					url = url.replace(temp, "");
				}

			});
		}
	}
	return url;

}
/**
 * 保存config配置结果
 */
var configs = function (val) {
	let bomConfig = {};
	bomConfig.items = [];
	bomConfig.config = {};
	let remoteTags = []
	vue.$data.configSteps.forEach(item => {
		if (item.isCopy == true || item.copyAble__c == 1) {
			remoteTags.push(item.name);
		}
	})
	let orderId = getQueryString("orderId");//所属订单
	let userId = getQueryString("userId");
	if (!orderId && !vue.$data.copyInfo.order__c) {
		vue.$message.error("没有获取到订单数据ID无法保存数据");
		return;
	}
	bomConfig.config.userId = userId;
	bomConfig.config.enableAutoCalc__c = vue.$data.enableAutoCalc
	bomConfig.config.remoteConfigTitles__c = remoteTags.join();
	bomConfig.config.order__c = vue.$data.orderId;
	bomConfig.config.name = vue.$data.configName;
	bomConfig.config.configType__c = vue.$data.configType;
	bomConfig.config.systemType__c = systemTypeMap[vue.$data.systemType];
	bomConfig.config.seriesType__c = vue.$data.seriesType;
	bomConfig.config.customType__c = vue.$data.customType__c;
	if (getQueryString('operateType') && getQueryString('operateType') == 'edit') {
		//如果是编辑操作，则会将configId放置到参数中传入后台。
		//后端接口依据这个id是否存在来判断是走创建还是更新
		bomConfig.config.id = vue.$data.configId;
	} else {
		//不是编辑操作。
		//就判断configId是否存在
		if (vue.$data.configId) {
			bomConfig.config.id = vue.$data.configId;
		}
	}
	let ios = ioCount()

	bomConfig.config.totalIoCount__c = ios   //sum(卡件数*点数）
	let hasError = false;
	for (apiKey in vue.itemApiKeys) {
		let item = {};
		item.name = apiKey;
		//判断这个配置项是本地端还是远端配置。
		//这个参数用于存储到BOM中后面展现时，
		//由此参数判断该配置项应该放在本地还是远端。
		let isRemotOrNot = distRemoteOr(apiKey);
		if (isRemotOrNot.remoteOr) {
			item.localOrRemot__c = 2;
			item.remoteName__c = isRemotOrNot.stepName;
		} else {
			item.localOrRemot__c = 1;
		}
		if (vue.$data.editConfigItemsId[apiKey]) {//如果存则说明是已经保存过的配置项。需要把ID带回后台进行更新动作
			item.id = vue.$data.editConfigItemsId[apiKey];
		}
		let configItem = getConfigItem(apiKey);
		debugger;
		if (configItem == undefined) {
			continue;
		}
		item.itemType__c = configItem.componmentType__c;
		item.configurationStepId__c = configItem.confiurationStepId__c;
		item.configurationBolckId__c = configItem.confiurationBlockId__c;
		if (configItem.isParam__c) {//如果是参数
			item.itemValue__c = getItemValue(apiKey);
			if (item.itemType__c == 3) {//数值
				bomConfig.items.push(item);
			} else if (item.itemType__c != 3 && item.itemValue__c) {//针对是参数项的下拉选择
				bomConfig.items.push(item);
			}
			if (item.itemType__c == 4) {
				bomConfig.items.push(item);
			}

		} else {
			if (item.itemType__c == 4) {//开关选项
				item.itemValue__c = getItemValue(apiKey);
				bomConfig.items.push(item);
			}
			else if (item.itemType__c == 5) {//下拉选择
				item.itemValue__c = getItemValue(apiKey);
				item.itemQuantity__c = getItemQuantity(apiKey);
				if (item.itemValue__c && item.itemValue__c != "") {
					debugger;
					let productInfo = getItemInfo(apiKey);
					// if (productInfo && productInfo.productId__c) {
					if (productInfo) {
						//增加订单级别币种信息的判断
						//增加针对物料类别为2.01（bomItemOrder=25）和3.01(bomItemOrder=33) 的需要乘以计算因子
						item.bomItemOrder__c = productInfo == undefined ? '' : productInfo['orderNumInBom__c'];
						item.productId__c = productInfo == undefined ? '' : productInfo['productId__c'];
						item.rate__c = productInfo == undefined ? '' : productInfo['rate__c'];
						if (bomConfig.config.customType__c == 2 && (productInfo['orderNumInBom__c'].indexOf("25.") > -1 || productInfo['orderNumInBom__c'].indexOf("33.") > -1)) {
							//物料类别为2.01（orderNumInBom__c=25.***）和3.01(orderNumInBom__c=33.***) 的需要乘以计算因子
							// 表价=计算因子 * 表价
							if (vue.$data.currencyUnit == '美元') {
								//币种
								item.price__c = Number(productInfo['calcFactor__c']) * productInfo['rate__c'] * Number(productInfo['price__c'])
								//表价=汇率*表价
								item.listPrice__c = Number(productInfo['calcFactor__c']) * productInfo['rate__c'] * Number(productInfo['listPrice__c']);
							} else {
								item.price__c = Number(productInfo['calcFactor__c']) * Number(productInfo['price__c'])

								item.listPrice__c = Number(productInfo['calcFactor__c']) * Number(productInfo['listPrice__c']);
							}
						} else {
							if (vue.$data.currencyUnit == '美元') {
								//币种
								//表价=汇率*表价
								item.price__c = productInfo['rate__c'] * Number(productInfo['price__c'])
								item.listPrice__c = productInfo['rate__c'] * Number(productInfo['listPrice__c']);
							} else {
								item.listPrice__c = productInfo['listPrice__c'];
								item.price__c = productInfo['price__c'];
							}
						}
						item.discountable__c = productInfo == undefined ? '' : productInfo['discountable__c'];
						bomConfig.items.push(item);
					} else {
						if (item.itemQuantity__c > 0) {
							hasError = true;
							let url = "/rest/data/v2.0/scripts/api/neocrm/bom/query/product/code?code=" + encodeURIComponent(item.itemValue__c);
							url = urlLocalParamProcess(url);//针对配置中包含了#xxxx#的配置参数进行替换处理
							let config = {
								method: 'get',
								url: url,
								contentType: 'application/json'
							};
							lapp.connection.invoke(config).then(function (res) {
								if (res.data && res.status == 200) {
									let promotMsg = "配置项:【" + item.name + "】<br/>物料:【" + res.data.name + "】<br/>型号:【" + res.data.productVariety__c + "】<br/>物料编码:【" + item.itemValue__c + "】<br/>该物料已经被禁,或不适用于当前配置使用，请更换";
									vue.$message({
										dangerouslyUseHTMLString: true,
										message: promotMsg,
										type: 'error'
									});

								}
							}).catch(function (err) {
								vue.$message.error(err)
								reject(err)
							});
							return;
						}
					}
				}
			}
			else if (item.itemType__c == 8) {//(备件)transfer穿梭框
				let values = getItemValue(apiKey);
				let products = getItemInfo(apiKey);
				let spares = [];
				values.forEach(v => {
					let spareItem = {};
					let quantityKey = apiKey + '_' + v;
					let quantity = vue.sparesQuantity[quantityKey];
					spareItem.productCode__c = v;
					spareItem.name = apiKey;
					spareItem.itemQuantity__c = quantity;
					let productInfo = products[v];
					if (productInfo != undefined && productInfo != null) {
						spareItem.bomItemOrder__c = productInfo == undefined ? '' : productInfo['orderNumInBom__c'];
						spareItem.productId__c = productInfo == undefined ? '' : productInfo['productId__c'];
						spareItem.rate__c = productInfo == undefined ? '' : productInfo['rate__c'];
						if (bomConfig.config.customType__c == 2 && (productInfo['orderNumInBom__c'].indexOf("25.") > -1 || productInfo['orderNumInBom__c'].indexOf("33.") > -1)) {
							//物料类别为2.01（orderNumInBom__c=25.***）和3.01(orderNumInBom__c=33.***) 的需要乘以计算因子
							// 表价=计算因子 * 表价
							if (vue.$data.currencyUnit == '美元') {
								//币种
								//表价=汇率*表价
								spareItem.price__c = Number(productInfo['calcFactor__c']) * productInfo['rate__c'] * Number(productInfo['price__c']);
								spareItem.listPrice__c = Number(productInfo['calcFactor__c']) * productInfo['rate__c'] * Number(productInfo['listPrice__c']);
							} else {
								spareItem.price__c = Number(productInfo['calcFactor__c']) * Number(productInfo['price__c']);
								spareItem.listPrice__c = Number(productInfo['calcFactor__c']) * Number(productInfo['listPrice__c']);
							}
						} else {
							if (vue.$data.currencyUnit == '美元') {
								//币种
								//表价=汇率*表价
								spareItem.price__c = productInfo['rate__c'] * Number(productInfo['price__c'])
								spareItem.listPrice__c = productInfo['rate__c'] * Number(productInfo['listPrice__c']);
							} else {
								spareItem.price__c = productInfo['price__c'];
								spareItem.listPrice__c = productInfo['listPrice__c'];
							}
						}
						spareItem.discountable__c = productInfo == undefined ? '' : productInfo['discountable__c'];
						if (spareItem.itemQuantity__c && spareItem.itemQuantity__c > 0) {
							spares.push(spareItem);
						}
					} else {
						if (quantity > 0) {
							hasError = true;
							let url = "/rest/data/v2.0/scripts/api/neocrm/bom/query/product/code?code=" + encodeURIComponent(v);
							url = urlLocalParamProcess(url);//针对配置中包含了#xxxx#的配置参数进行替换处理
							let config = {
								method: 'get',
								url: url,
								contentType: 'application/json'
							};
							lapp.connection.invoke(config).then(function (res) {
								if (res.data && res.status == 200) {
									let promotMsg = "配置项:【" + spareItem.name + "】<br/>物料:【" + res.data.name + "】<br/>型号:【" + res.data.productVariety__c + "】<br/>物料编码:【" + v + "】\r该物料已经被禁,或不适用于当前配置使用，请更换";
									vue.$message({
										dangerouslyUseHTMLString: true,
										message: promotMsg,
										type: 'error'
									});

								}
							}).catch(function (err) {
								vue.$message.error(err)
								reject(err);
							});
						}
						return;
					}

				});
				item.spares = spares;
				bomConfig.items.push(item);//是为了解决当在前端进行清空备件物料时也能有配置项传入到后端
			}
			else if (item.itemType__c == 9) {//(第三方硬件)表格
				let thirdPartsProducts = getItemValue(apiKey);
				if (thirdPartsProducts && thirdPartsProducts.length > 0) {
					for (let i in thirdPartsProducts) {
						let thirdProduct = thirdPartsProducts[i];
						let s = "";
						if (thirdProduct.name == null || thirdProduct.name.length == 0) {
							vue.$message.error("第三方物料名称不能为空，请填写");
							return;
						}
						if (thirdProduct.name) {
							s += thirdProduct.name
						} if (thirdProduct.vendor__c) {
							s += thirdProduct.vendor__c
						} if (thirdProduct.weight__c) {
							s += thirdProduct.weight__c
						} if (thirdProduct.wattage__c) {
							s += thirdProduct.wattage__c
						} if (thirdProduct.signalType__c) {
							s += thirdProduct.signalType__c
						} if (thirdProduct.remark__c) {
							s += thirdProduct.remark__c
						} if (thirdProduct.productVariety__c) {
							s += thirdProduct.productVariety__c
						} if (thirdProduct.productSeries__c) {
							s += thirdProduct.productSeries__c
						} if (thirdProduct.length__c) {
							s += thirdProduct.length__c
						}
						if (s.length > 200) {
							vue.$message.error("第三方物料:[" + thirdProduct.name + "]信息内容超出200字符，请精简后保存");
							return;
						}
					}
					item.thirdPartsProducts = thirdPartsProducts;
					item.itemValue__c = '15-99-03-00-00-04';//针对第三方硬件使用固定的物料编码
					item.bomItemOrder__c = 24.999;
				}
				bomConfig.items.push(item);//放到外面是为了解决当在前端进行清空第三发物料时也能有配置项传入到后端
			}
		}
	}
	if (hasError) {
		hasError = false;
		return;
	}
	if (bomConfig.items.length == 0) {
		vue.$message({
			message: '没有任何可用于保存的配置项，不进行保存',
			type: 'error'
		});
		return;
	} else {
		bomConfig.items.forEach(item => {
			if (getItemInfo(item.name) == undefined) {
				item.slotCount__c = 0
			} else {
				item.slotCount__c = getItemInfo(item.name).slotCount__c || 0;   //点数
			}
		});
	}
	let config = {
		method: 'post',
		url: '/rest/data/v2.0/scripts/api/neocrm/bom/save',
		contentType: 'application/json',
		data: bomConfig
	};
	if (val == 1) {
		showLoading();
	}
	lapp.connection.invoke(config)
		.then(response => {
			if (response.data && (response.data.code === 200 || response.data.code === '200')) {
				let configId = response.data.dataId;
				let itemsNameIdMap = response.data.itemsNameIdMap;
				vue.$data.configId = configId;
				vue.$data.editConfigItemsId = itemsNameIdMap;
				let currentConfigId = getQueryString("configId");
				let operateType = getQueryString("operateType");
				if (currentConfigId && operateType && operateType == "copy") {
					//当是拷贝操作时需要将configId更新成最新的id 并且将操作类型更新成edit
					let lc = window.location.href;
					lc = lc.replace(currentConfigId, configId);
					lc = lc.replace("copy", "edit");
					window.location.href = lc;
				} else if (!currentConfigId) {
					//判断如果当前浏览器地址栏内没有configId则将id追加进去并标识为编辑操作。
					//这一操作主要是是防止新建完成后客户刷新浏览器地址导致configId丢失
					let location = window.location;
					location = location + "&configId=" + configId + "&operateType=edit";
					window.location = location;
				}
				document.body.removeEventListener('beforeunload', checkLeave)
				if (val == 1) {
					vue.$alert('<sapn>Bom配置保存完成,您需要:</sapn><ul><li style="color:red">点击【查看BOM】点击【生成BOM】使配置生效</li><li>点击【查看BOM】按钮查看配置结果</li>', 'Bom配置保存完成', {
						dangerouslyUseHTMLString: true,
						confirmButtonText: '去操作',
					}).then(() => {
						queryOrderBomView(false);
						findNameEditAble();
						performOr();
					})
				}
			} else {
				vue.$message.error('保存Bom发生错误:' + response.data.message);
			}
			hideLoading();
		}).catch(err => {
			hideLoading()
			console.error("保存BOM发生异常");
		});
}
/**
 * 初始化查询人天限制数据
 */
var queryMpdLimits = function () {
	let param = {};
	param.xoql = "select entityType,configType__c,projectType__c,ioCount__c,limitDays__c,systemType__c from mpdLimits__c order by limitDays__c";
	param.useSimpleCode = false;
	var config = {
		method: 'post',
		url: '/rest/data/v2.0/query/xoql',
		contentType: 'application/x-www-form-urlencoded',
		data: param
	};
	showLoading();
	lapp.connection.invoke(config).then(response => {
		hideLoading()
		if (response.data && response.data.code === '200') {
			var result = response.data && response.data.data;
			if (result.count > 0) {
				var records = result.records;
				records.forEach(record => {
					let limit = {};
					limit.configType = record.configType__c;
					limit.configType = record.configType__c;
					if (record.projectType__c && record.projectType__c.length > 0) {
						limit.projectType = record.projectType__c[0];
					}
					if (record.systemType__c && record.systemType__c.length > 0) {
						limit.systemType = record.systemType__c[0];
					}
					if (record.ioCount__c) {
						limit.ioCount = record.ioCount__c;
					}
					limit.limitDays = record.limitDays__c;
					limit.entityType = record.entityType;
					vue.$data.mpdLimits.push(limit);
				});
				defaultQuantityArray.push({ item: vue.$data.series + "SiteService", defaultQuantity: getMpdLimits() });
				defaultQuantityArray.push({ item: vue.$data.series + "TCM", defaultQuantity: getTCMLimits() });
			}
		}
	}).catch(err => {
		hideLoading()
		console.error("查询服务天数限制发生异常:" + err);
	});
}
/**
 * 验证服务人天数是否低于最低限制 只有开启了自动计算的才走该逻辑
 */
var validateSiteServiceMpdLimits = function () {
	if (vue.$data.enableAutoCalc == 'true') {
		let limitDatys = getMpdLimits();
		let days = getItemQuantity(vue.$data.series + 'SiteService');
		if (limitDatys > days) {
			setItemQuantity(vue.$data.series + 'SiteService', limitDatys);
		}
	}
	return true;
}
var validateTCMLimits = function () {
	if (vue.$data.enableAutoCalc == 'true') {
		let limitDatys = getTCMLimits();
		let days = getItemQuantity(vue.$data.series + 'TCM');
		if (limitDatys > days) {
			setItemQuantity(vue.$data.series + 'TCM', limitDatys);
		}
	}
	return true;
}
var saveConfig = function (val) {
	if (vue.$data.Chassis_Sum > 15) {
		vue.$message.error('系统机架之和>15不支持，建议拆分系统');
		return;
	}
	debugger;
	let Main_Chassis_quantity = Number.isInteger(getItemQuantity(vue.$data.series + 'Main_Chassis')) ? getItemQuantity(vue.$data.series + 'Main_Chassis') : 0;
	let soft_1131_quantity = Number.isInteger(getItemQuantity(vue.$data.series + '1131')) ? getItemQuantity(vue.$data.series + '1131') : 0;
	if (soft_1131_quantity < Main_Chassis_quantity) {
		vue.$message.error("请展开软件系统配置，以确保系统组态软件的配置数量不少于主机架数量，并保存该配置");
		return;
	}
	validateSiteServiceMpdLimits();//服务人天
	validateTCMLimits();//开工会
	if (getQueryString('operateType') && getQueryString('operateType') == 'edit') {
		configs(val)
	} else {
		//判断名称是否重复
		let rconfig = {
			method: 'get',
			url: "/rest/data/v2/query?q=select id,name from BomConfig__c where name='" + vue.$data.configName + "'",
			contentType: 'application/json'

		};
		lapp.connection.invoke(rconfig).then(function (res) {
			if (res.data && res.data.code == 200) {
				if (res.data.result.totalSize == 0) { //
					configs(val)
				} else {
					vue.$message.error('已存在重复名称产品')
					return false
				}
			} else {
				vue.$message.error(res.data.msg)
			}
		});
	}
}

/**
 * 根据主产品ID查询产品包信息
 * @param {String} mainProductId - 主产品ID（productPackage__c的外键mainProduct__c）
 * @returns {Promise} 返回查询到的records数组
 */
var queryProductPackage = function (mainProductId) {
	return new Promise(function (resolve, reject) {
		if (!mainProductId) {
			resolve([]);
			return;
		}
		let param = {};
		param.xoql = "select id,name,quantity__c from productPackage__c where mainProduct__c=" + mainProductId;
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
/**
 * 查询用户信息，用于判断用户的一级部门是否是【销售中心】
 * @returns {Promise<unknown>}
 *
 */
var queryUserInfo = function () {
	return new Promise((resolve, reject) => {
		let userId = getQueryString("userId");
		if (userId && userId != "") {
			var config = {
				method: 'get',
				url: '/rest/data/v2/query?q=select id,primarySector__c from user where id=' + userId,
				contentType: 'application/json'
			};
			lapp.connection.invoke(config).then(function (response) {
				let primarySector = "";
				if (response.data && response.status === 200) {
					primarySector = response.data.result.records[0]['primarySector__c'];
				}
				resolve(primarySector);
			});
		} else {
			resolve("没有用户信息");
		}
	});
}
/**
 * 查询当前配置所属订单的全部配置的BomView
 */
var queryOrderBomView = function (current) {
	debugger;
	vue.$data.isShowCurrnt = current;
	if (vue.$data.orderId) {
		let useNewAddress = getQueryString("useNewAddress");
		let url = '/rest/data/v2.0/scripts/api/neocrm/bom/query/bom/view/all?orderId=' + vue.$data.orderId;
		if (current) {
			url = '/rest/data/v2.0/scripts/api/neocrm/bom/query/bom/view/all?orderId=' + vue.$data.orderId + "&configId=" + vue.$data.configId;
		}
		var config = {
			method: 'get',
			url: url,

		};
		if (useNewAddress) {
			config = {
				method: 'get',
				url: 'https://crm-mw.consen.net:18443/kjsbom/newOrderBomViewServlet?orderId=' + vue.$data.orderId
			};
		}
		showLoading();
		lapp.connection.invoke(config).then(function (response) {
			if (response.data && response.status === 200) {
				vue.$data.configNames = response.data.configNames;
				vue.$data.steps = response.data.steps;
				vue.$data.totalCardPoint = response.data.totalCardPoint;
				vue.$data.totalRequirePoint = response.data.totalRequirePoint;
				//vue.$data.customItem304__c=Number(response.data.customItem304__c);//运保费
				vue.$data.bomShow = true;
				debugger;
				priceAllTypeCalc()
				getSwitch().then(flag => {
					if (vue.$data.switchFlag == false) {
						vue.$data.settings['discountType'] = "系统评估及服务";
					} else {
						vue.$data.settings['discountType'] = "硬件";
					}
				});


			}
			hideLoading();
		});
	} else {
		vue.$message.error('当前配置界面没有可用于预览Bom配置。请先将当前配置进行保存操作');
	}
}

/**
 * 根据主产品ID查询产品包信息
 * @param {String} mainProductId - 主产品ID（productPackage__c的外键mainProduct__c）
 * @returns {Promise} 返回查询到的records数组
 */
var queryProductPackage = function (mainProductId) {
	return new Promise(function (resolve, reject) {
		if (!mainProductId) {
			resolve([]);
			return;
		}
		let param = {};
		param.xoql = "select id,name,quantity__c from productPackage__c where mainProduct__c=" + mainProductId;
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
/**
 *
 * 保存物料的折扣信息
 */
var saveDiscountInfo = function () {
	let arr = [];
	let all = vue.$data.steps
	if (all && all.length > 0) {
		for (i = 0; i < all.length; i++) {
			let groups = all[i].groups;
			for (j = 0; j < groups.length; j++) {
				let items = groups[j]['children'];
				for (k = 0; k < items.length; k++) {
					let update = { 'productCode__c': items[k]['itemValue__c'], 'discount__c': items[k]['discount__c'], 'discountPrice__c': items[k]['discountPrice__c'], 'price__c': items[k]['price__c'], 'listPrice__c': items[k]['listPrice__c'] };
					if (items[k]['notes__c'] && items[k]['notes__c'] != "") {
						update.notes__c = items[k]['notes__c'];
					}
					if (items[k]['itemValue__c'] == "15-99-03-00-00-04") {//第三方物料
						update["productVariety__c"] = items[k]["productVariety__c"];
					}
					arr.push(update);
				}
			}
		}
	}
	//是执行订单，界面没有进行任何操作时，自动计算 vue.$data.discounts
	//if((JSON.stringify(vue.$data.discounts)=="{}") && (vue.$data.isOrderOr==true)){
	vue.$data.discountOptions.forEach(item => {
		vue.$data.typePrices.forEach(item2 => {
			if (item2.label == item.label) {
				averageDiscount(item.label, item2.aa, [], vue.$data.steps)
			}
		})
	})
	//}
	if (vue.$data.discounts['hardWareDiscount__c'] == null || vue.$data.discounts['hardWareDiscount__c'] == undefined) {
		vue.$data.discounts['hardWareDiscount__c'] = 0;
	}
	if (vue.$data.discounts['systemEvaluation__c'] == null || vue.$data.discounts['systemEvaluation__c'] == undefined) {
		vue.$data.discounts['systemEvaluation__c'] = 0;
	}
	if (vue.$data.discounts['systemOptimization__c'] == null || vue.$data.discounts['systemOptimization__c'] == undefined) {
		vue.$data.discounts['systemOptimization__c'] = 0;
	}
	if (vue.$data.discounts['softWareDiscount__c'] == null || vue.$data.discounts['softWareDiscount__c'] == undefined) {
		vue.$data.discounts['softWareDiscount__c'] = 0;
	}

	var config = {
		method: 'post',
		url: '/rest/data/v2.0/scripts/api/neocrm/createProductByOrder',
		contentType: 'application/json',
		data: { orderId: vue.$data.orderId, 'discountArray': arr, "discountSummary": vue.$data.discounts }
	};
	showLoading();
	lapp.connection.invoke(config).then(function (response) {

		if (response.data.code == 200) {
			vue.$message({
				message: 'BOM数据已经在处理中，请进入bom明细界面查看保存结果',
				type: 'success'
			});
		} else {
			vue.$message({
				message: response.data.message,
				type: 'error'
			})
		}
		hideLoading();
	});
}

//根据name判断是否其是否归属远端配置,及归属于哪个远端配置
var distRemoteOr = function (name) {
	if (!vue.$data.itemApiKeys[name] || vue.$data.itemApiKeys[name] == undefined) {
		return false
	}
	let v = vue.$data.itemApiKeys[name]
	let blockId = v.split('::')[1]
	let stepId = ''
	let a = {}
	for (let key in vue.$data.configblocks) {
		if (vue.$data.configblocks[key].length > 0) {
			vue.$data.configblocks[key].forEach(item => {
				if (item.id == blockId) {
					if (item.id.indexOf('_') == -1) {
						stepId = item.confiurationStepId__c
					} else {
						let n = Number(item.id.substring(item.id.length - 1))
						stepId = item.confiurationStepId__c + '#' + n
					}
				}
			})
		}
	}
	vue.$data.configSteps.forEach(item => {
		if (item.id == stepId) {
			a.stepName = item.name
			if (item.copyAble__c == 1 || item.isCopy) {
				a.remoteOr = true
			} else {
				a.remoteOr = false
			}
		}
	})
	return a
}
var initDisable = function () {
	let disables = ['DI_Module', 'DI_ETP', 'DI_ETP2', 'DO_Module', 'DO_ETP', 'DO_ETP2',
		'AI_Module', 'AI_ETP', 'AI_ETP2', 'AO_Module', 'AO_ETP', 'AO_ETP2', 'PI_Module', 'PI_ETP', 'TC_terminal', "1131"]
	let seDisables = []
	if (vue.$data.series == '') {
		disables.push('AO_Module2')
		seDisables.push('AO_Module2', 'AO_ETP2')
	} else if (vue.$data.series == 'TSx_') {
		disables.push('VM_Module', 'SM_Module', 'VM_ETP', 'SM_ETP', 'PI_ETP2', 'OSP_ETP', 'IOBus_IM', 'IOBus_FCM', 'IOBus_FJumper', 'IOBus_SFCM', 'IOBus_SFJumper', 'OSP_ETP', 'IO_Cable', 'IOBus_MFCM')
		seDisables.push('TSx_OSP_ETP')
		vue.$data.disables.push('TSx_VM_Module', 'TSx_VM_ETP', 'TSx_SM_Module', 'TSx_SM_ETP')
	} else if (vue.$data.series == 'CX_') {
		let fets = ['DI_FET', 'DI_FET2', 'DO_FET', 'DO_FET2', 'AI_FET', 'AI_FET2', 'AO_FET', 'AO_FET2', 'PI_FET', 'UIO_FET', 'UIO_FET2', 'UIO_Module', 'UIO_ETP', 'UIO_ETP2', 'IO_Cable', 'IOBus_FJumper']
		fets.forEach(item => {
			vue.$data.disables.push(vue.$data.series + item, vue.$data.series + 'Remote' + item)
		})
	}
	disables.forEach(item => {
		vue.$data.disables.push(vue.$data.series + item)
		vue.$data.disables.push(vue.$data.series + 'Remote' + item)
	})
	if (seDisables.length > 0) {
		seDisables.forEach(item => {
			vue.$data.seDisables.push(vue.$data.series + item)
			vue.$data.seDisables.push(vue.$data.series + 'Remote' + item)
		})
	}
}

/**
 * 根据主产品ID查询产品包信息
 * @param {String} mainProductId - 主产品ID（productPackage__c的外键mainProduct__c）
 * @returns {Promise} 返回查询到的records数组
 */
var queryProductPackage = function (mainProductId) {
	return new Promise(function (resolve, reject) {
		if (!mainProductId) {
			resolve([]);
			return;
		}
		let param = {};
		param.xoql = "select id,name,quantity__c from productPackage__c where mainProduct__c=" + mainProductId;
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
//安全栅、浪涌等
var barrier_calc = function (p, p1) {
	let a = getItemValue(p)
	setItemQuantity(p1, a)
}
//计算所有总价
var calcAll = function (type, arr, steps) {
	let totalPrice1 = 0
	let typePrice1 = 0
	let discountAllPrice1 = 0
	let aa = 0
	if (steps.length) {
		steps.forEach(step => {
			if (step.groups && step.groups.length) {
				step.groups.forEach(group => {
					if (group.children && group.children.length) {
						let itemTotalPrice_group = 0;//所有物料的表价*数量和
						let discountPrice_group = 0 //折后价格*数量之和
						let itemTypePrice = 0//当前传入的计算折扣的大类的表价*数量和
						let listPriceAndDiscountPrice = 0//表价*数量+折后价*数量和
						//SUM(表价 *数量*(2.01时的CCP点数))
						itemTotalPrice_group = group.children.reduce((cur, prev) => {
							if (prev.listPrice__c == undefined) {
								prev.listPrice__c = 0
							}
							if (prev.itemQuantity__c == undefined) {
								prev.itemQuantity__c = 0
							}
							let ccpTotalCardPoint = 1
							let squantity = prev.itemQuantity__c
							if (prev.groupOrder == '2.01') {
								ccpTotalCardPoint = prev.ccpTotalCardPoint == undefined ? 1 : prev.ccpTotalCardPoint;
								squantity = 1
							}
							return cur + squantity * prev.listPrice__c * ccpTotalCardPoint
						}, 0);
						//SUM(当前计算的折扣类的物料的 表价*数量)
						itemTypePrice_group = group.children.reduce((cur, prev) => { //当前打折类的折前总额之和
							if (prev.listPrice__c == undefined) {
								prev.listPrice__c = 0
							}
							if (prev.itemQuantity__c == undefined) {
								prev.itemQuantity__c = 0
							}
							let ccpTotalCardPoint = 1;
							let squantity = prev.itemQuantity__c;
							if (prev.groupOrder == '2.01') {
								ccpTotalCardPoint = prev.ccpTotalCardPoint == undefined ? 1 : prev.ccpTotalCardPoint;
								squantity = 1
							}
							let isCurrentType = prev.discountCategory__c == type ? 1 : 0
							return cur + squantity * prev.listPrice__c * isCurrentType * ccpTotalCardPoint;
						}, 0);
						// SUM(当前计算的折扣类中的物料中 所有可打折类物料的 折后价*数量)
						discountPrice_group = group.children.reduce((cur, prev) => {  //可打折的物料
							if (prev.listPrice__c == undefined) {
								prev.listPrice__c = 0
							}
							if (prev.itemQuantity__c == undefined) {
								prev.itemQuantity__c = 0
							}
							if (prev.discountPrice__c == undefined) {
								prev.discountPrice__c = 0
							}
							if (prev.discountable__c == 'true') {
								prev.discountable__c = 1
							} else if (prev.discountable__c == 'false' || prev.discountable__c == undefined) {
								prev.discountable__c = 0
							}
							let isCurrentType = prev.discountCategory__c == type ? 1 : 0;
							return cur + Number(prev.itemQuantity__c) * Number(prev.discountPrice__c) * prev.discountable__c * isCurrentType
						}, 0);
						//SUM(当前计算的折扣类物料中 可打折物料的 折后价*数量（2.01 大类的再乘以当前CCP点数,不可打折的 表价*数量（2.01大类的再乘以当前CCP点数））)
						listPriceAndDiscountPrice_group = group.children.reduce((cur, prev) => {  //可打折 + 不可打折 总原价
							if (prev.listPrice__c == undefined) {
								prev.listPrice__c = 0
							}
							if (prev.itemQuantity__c == undefined) {
								prev.itemQuantity__c = 0
							}
							if (prev.discountPrice__c == undefined) {
								prev.discountPrice__c = 0
							}
							let ccpTotalCardPoint = 1
							let quantity = Number(prev.itemQuantity__c);
							if (prev.groupOrder == '2.01') {
								ccpTotalCardPoint = prev.ccpTotalCardPoint == undefined ? 1 : prev.ccpTotalCardPoint;
								quantity = 1
							}
							let isCurrentType = prev.discountCategory__c == type ? 1 : 0
							if (prev.discountable__c == 'true' || prev.discountable__c == 1) {
								prev.discountable__c = 1
								return cur + quantity * Number(prev.discountPrice__c) * isCurrentType * ccpTotalCardPoint;
							} else {
								prev.discountable__c = 0
								return cur + quantity * Number(prev.listPrice__c) * isCurrentType * ccpTotalCardPoint;
							}
						}, 0);
						group.itemTotalPrice = itemTotalPrice_group // 配置模块中 所有配置的物料的 表价*数量 （2.01大类的再乘以当前CCP点数）的 合计
						group.discountPrice = discountPrice_group  //该配置模块中 当前可打折类下 所有可打折物料折后价总和 （2.01大类的再乘以当前CCP点数）;
						group.itemTypePrice = itemTypePrice_group //该配置模块中 当前可打折类下 所有物料（包括不可打折的物料）的折前价格*数量的总和（2.01大类的再乘以当前CCP点数）
						group.listPriceAndDiscountPrice = listPriceAndDiscountPrice_group//该配置模块中 当前可打折类下 所可打折的折后价*数量(如果是2.01*CCP点数) + 所有不可打折的 表价*数量(如果是2.01*CCP点数)
					} else {
						group.listPriceAndDiscountPrice = 0
						group.discountPrice = 0
						group.itemTotalPrice = 0
						group.itemTypePrice = 0
					}
				});
				let sumOfAllGroupListPrice_step = 0;//汇总 某配置步骤下 所有配置模块下 物料的 表价*数量的合计
				let sumOfItemTypePrice_step = 0;
				let sumOfDiscountPrice_step = 0;
				let sumOfListPriceAndDiscountPrice_step = 0;
				sumOfAllGroupListPrice_step = step.groups.reduce((cur, prev) => {  //大类所有物料 表价总和
					if (prev.itemTotalPrice == undefined) {
						prev.itemTotalPrice = 0
					}
					return cur + prev.itemTotalPrice
				}, 0);
				step.itemTotalPrice = sumOfAllGroupListPrice_step;

				sumOfItemTypePrice_step = step.groups.reduce((cur, prev) => {  //原价  该配置步骤下 当前打折类下 所有物料（包括不可打折的物料）的折前价格*数量的总和（2.01大类的再乘以当前CCP点数）
					if (prev.itemTypePrice == undefined) {
						prev.itemTypePrice = 0
					}
					return cur + prev.itemTypePrice
				}, 0);
				step.itemTypePrice = sumOfItemTypePrice_step;

				sumOfDiscountPrice_step = step.groups.reduce((cur, prev) => {  //当前配置步骤下 当前打折类下 所有可打折物料折后价总和 （2.01大类的再乘以当前CCP点数）;
					if (prev.discountPrice == undefined) {
						prev.discountPrice = 0
					}
					return cur + prev.discountPrice
				}, 0);

				sumOfListPriceAndDiscountPrice_step = step.groups.reduce((cur, prev) => {  //可打折+不可打折 总价  该配置步骤中 当前打折类下 所可打折的折后价*数量(如果是2.01*CCP点数) + 所有不可打折的 表价*数量(如果是2.01*CCP点数)
					if (prev.listPriceAndDiscountPrice == undefined) {
						prev.listPriceAndDiscountPrice = 0
					}
					return cur + prev.listPriceAndDiscountPrice
				}, 0)
				step.itemTotalPrice = sumOfAllGroupListPrice_step;
				step.itemTypePrice = sumOfItemTypePrice_step;
				step.discountPrice = sumOfDiscountPrice_step;
				step.a1 = sumOfListPriceAndDiscountPrice_step;
			} else {
				step.itemTotalPrice = 0;
				step.itemTypePrice = 0;
				step.discountPrice = 0;
				step.a1 = 0;
			}
		});
		//所有 汇总所有配置步骤下的计算结果

		totalPrice1 = steps.reduce((cur, prev) => {  //该订单下所有配置的表价*数量*（点数， 大类为2.01时）
			return cur + prev.itemTotalPrice
		}, 0);

		typePrice1 = steps.reduce((cur, prev) => {  //当前计算的折扣类下 的 表价*数量*（点数， 大类为2.01时）
			return cur + prev.itemTypePrice
		}, 0);

		discountAllPrice1 = steps.reduce((cur, prev) => {  //当前计算的折扣类下  所有可打折物料折后价总和
			return cur + prev.discountPrice
		}, 0);

		aa = steps.reduce((cur, prev) => { // 当前打折类下 所可打折的折后价*数量(如果是2.01*CCP点数) + 所有不可打折的 表价*数量(如果是2.01*CCP点数)
			return cur + prev.a1
		}, 0);
	} else {
		totalPrice1 = 0
		typePrice1 = 0
		discountAllPrice1 = 0
		aa = 0
	}
	vue.$data.allTotal = totalPrice1
	let obj = {}
	obj.price = typePrice1;
	obj.discountPrice = discountAllPrice1
	obj.aa = aa//当前打折类下 所可打折的折后价*数量(如果是2.01*CCP点数) + 所有不可打折的 表价*数量(如果是2.01*CCP点数)
	return obj
}
var averageInputDiscount = function (row, type, arr1) {
	//相同物料 折扣随之变化
	if (arr1 && arr1.length) {
		arr1.forEach(item => {
			if (item.groups && item.groups.length) {
				item.groups.forEach(item2 => {
					if (item2.itemValue__c != '15-99-03-00-00-04') {
						if (item2.itemValue__c == row.itemValue__c) {
							item2.discountPrice__c = row.discountPrice__c
							item2.discount__c = row.discount__c
							item2.listPrice__c = row.listPrice__c
						}
					}

					if (item2.children && item2.children.length) {
						item2.children.forEach(item3 => {
							if (item3.itemValue__c != '15-99-03-00-00-04') {
								if (item3.itemValue__c == row.itemValue__c) {
									item3.discountPrice__c = row.discountPrice__c
									item3.discount__c = row.discount__c
									item3.listPrice__c = row.listPrice__c
								}
							}

						})
					}
				})
			}
		})
	}
	//重新计算折后 总价 及 各单项价格
	vue.$data.typePrices = []
	vue.$data.discountOptions.forEach(item => {
		let a = {}
		a.label = item.label
		a.value = item.value
		let b = calcAll(item.value, [], vue.$data.steps)
		let c = Object.assign(a, b)
		vue.$data.typePrices.push(c)
	})
	let ab = vue.$data.typePrices.reduce((cur, prev) => {
		if (prev.price == undefined) {
			prev.price = 0
		}
		return cur + prev.price
	}, 0)
	let c = vue.$data.allTotal - ab
	vue.$data.otherPrice = c
	vue.$data.typePrices.push({
		label: '其他',
		value: '9',
		price: c,
		discountPrice: c,
		aa: c
	})
	let allDiscount = 0
	for (let key in vue.$data.typePrices) {
		allDiscount += vue.$data.typePrices[key].aa
	}
	//allDiscount+=Number(vue.$data.customItem304__c);//增加上运保费
	vue.$data.discountPrice = allDiscount
	//计算平均折扣
	let totalPrice1 = 0
	let discountAbleTotal1 = 0
	let discountTotal1 = 0 //差价
	if (arr1 && arr1.length) {
		arr1.forEach(item => {
			if (item.groups && item.groups.length) {
				item.groups.forEach(item2 => {
					if (item2.children && item2.children.length) {
						let itemTotalPrice = item2.children.reduce((cur, prev) => {
							if (prev.listPrice__c == undefined) {
								prev.listPrice__c = 0
							}
							if (prev.itemQuantity__c == undefined) {
								prev.itemQuantity__c = 0
							}
							let a = 0
							if (prev.discountCategory__c != undefined) {
								a = prev.discountCategory__c == type ? 1 : 0
							}
							return cur + prev.itemQuantity__c * prev.listPrice__c * a
						}, 0)
						item2.itemTotalPrice = itemTotalPrice
						let discountAblePrice = item2.children.reduce((cur, prev) => {  //可打折的物料
							if (prev.listPrice__c == undefined) {
								prev.listPrice__c = 0
							}
							if (prev.itemQuantity__c == undefined) {
								prev.itemQuantity__c = 0
							}
							let a = 0
							if (prev.discountCategory__c != undefined) {
								a = prev.discountCategory__c == type ? 1 : 0
							}
							if (prev.discountable__c == 'true') {
								//	prev.discountable__c=1
							} else if (prev.discountable__c == 'false' || prev.discountable__c == undefined) {
								prev.discountable__c = 0
							}
							return cur + prev.itemQuantity__c * prev.listPrice__c * prev.discountable__c * a
						}, 0)
						item2.discountAblePrice = discountAblePrice
						let discountPrice = item2.children.reduce((cur, prev) => {  //可打折的物料
							if (prev.listPrice__c == undefined) {
								prev.listPrice__c = 0
							}
							if (prev.itemQuantity__c == undefined) {
								prev.itemQuantity__c = 0
							}
							if (prev.discountPrice__c == undefined) {
								prev.discountPrice__c = 0
							}
							let a = 0
							if (prev.discountCategory__c != undefined) {
								a = prev.discountCategory__c == type ? 1 : 0
							}
							if (prev.discountable__c == 'true') {
								//prev.discountable__c=1
							} else if (prev.discountable__c == 'false' || prev.discountable__c == undefined) {
								prev.discountable__c = 0
							}
							return cur + prev.itemQuantity__c * prev.discountPrice__c * prev.discountable__c * a
						}, 0)
						item2.discountPrice = discountPrice
					} else {
						item2.itemTotalPrice = 0
						item2.discountAblePrice = 0
						item2.discountPrice = 0
					}
				})
				let a = item.groups.reduce((cur, prev) => {  //原价
					return cur + prev.itemTotalPrice
				}, 0)
				let b = item.groups.reduce((cur, prev) => {  //可打折
					return cur + prev.discountAblePrice
				}, 0);
				let c = item.groups.reduce((cur, prev) => {  //差价
					return cur + prev.discountPrice
				}, 0)
				item.itemTotalPrice = a
				item.discountAblePrice = b
				item.discountPrice = c
			} else {
				item.itemTotalPrice = 0
				item.discountAblePrice = 0
				item.discountPrice = 0
			}
		})
		//所有远程
		totalPrice1 = arr1.reduce((cur, prev) => {  //折扣前总价
			return cur + prev.itemTotalPrice
		}, 0)
		discountAbleTotal1 = arr1.reduce((cur, prev) => {  //折扣前可打折的物料总价
			return cur + prev.discountAblePrice
		}, 0)
		discountTotal1 = arr1.reduce((cur, prev) => {  //差价
			return cur + prev.discountPrice
		}, 0)
	} else {
		totalPrice1 = 0
		discountAbleTotal1 = 0
		discountTotal1 = 0
	}
	let allTotal = totalPrice1 //本地+远程   折前总原价
	let allDiscountTotal = discountAbleTotal1   //本地+远程  折前可打折的总原价
	let discountPrice = discountTotal1
	// 差价=折前总价 - 折后总价
	// 差价分摊到可打折的物料上
	// 折扣 = 1-（差价/可打折的物料总原价）
	// let discountPrice = Math.abs(allTotal - val)  //差价
	//let discountPrice = allTotal - val  //差价
	//	let discount = 1 - (discountPrice / allDiscountTotal)
	let discount = 0
	if (allDiscountTotal != 0) {
		discount = 1 - (discountPrice / allDiscountTotal);
	}
	if (type == '硬件' && discount != null) {//硬件折扣
		vue.$data.discounts['hardWareDiscount__c'] = (discount).toFixed(4);
	} else if (type == '系统评估及服务' && discount != null) {//系统评估及服务折扣
		vue.$data.discounts['systemEvaluation__c'] = (discount).toFixed(4);
	} else if (type == '系统优化及服务' && discount != null) {//系统优化及服务折扣
		vue.$data.discounts['systemOptimization__c'] = (discount).toFixed(4);
	} else if (type == '软件' && discount != null) {//软件
		vue.$data.discounts['softWareDiscount__c'] = (discount).toFixed(4);
	}
}

/**
 * 根据主产品ID查询产品包信息
 * @param {String} mainProductId - 主产品ID（productPackage__c的外键mainProduct__c）
 * @returns {Promise} 返回查询到的records数组
 */
var queryProductPackage = function (mainProductId) {
	return new Promise(function (resolve, reject) {
		if (!mainProductId) {
			resolve([]);
			return;
		}
		let param = {};
		param.xoql = "select id,name,quantity__c from productPackage__c where mainProduct__c=" + mainProductId;
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
var averageDiscount = function (type, val, arr, arr1) {  //目标额度输入 计算平均折扣
	console.info("进入计算折扣点数：" + type)
	let totalPrice = 0
	let totalPrice1 = 0
	let discountAbleTotal = 0
	let discountAbleTotal1 = 0
	if (arr1 && arr1.length) {
		arr1.forEach(item => {
			if (item.groups && item.groups.length) {
				item.groups.forEach(item2 => {
					if (item2.children && item2.children.length) {
						let itemTotalPrice = item2.children.reduce((cur, prev) => {
							if (prev.listPrice__c == undefined) {
								prev.listPrice__c = 0
							}
							if (prev.itemQuantity__c == undefined) {
								prev.itemQuantity__c = 0
							}
							let a = 0
							if (prev.discountCategory__c != undefined && prev.discountCategory__c != '') {
								a = prev.discountCategory__c == type ? 1 : 0
							}
							let order = 1
							let iquantity = prev.itemQuantity__c
							if (prev.groupOrder == '2.01') {
								order = prev.ccpTotalCardPoint == undefined ? 1 : prev.ccpTotalCardPoint
								iquantity = 1
							}
							return cur + iquantity * prev.listPrice__c * a * order
						}, 0)
						item2.itemTotalPrice = itemTotalPrice

						let discountAblePrice = item2.children.reduce((cur, prev) => {  //可打折的物料
							if (prev.listPrice__c == undefined) {
								prev.listPrice__c = 0
							}
							if (prev.itemQuantity__c == undefined) {
								prev.itemQuantity__c = 0
							}
							// if((prev.discountable__c=='true' || prev.discountable__c==1) && prev.inFramework__c!=1){
							if (prev.discountable__c == 'true' || prev.discountable__c == 1) {
								prev.discountable__c = 1
							} else {
								prev.discountable__c = 0
							}
							let a = 0
							if (prev.discountCategory__c != undefined && prev.discountCategory__c != '') {
								a = prev.discountCategory__c == type ? 1 : 0
							}
							return cur + prev.itemQuantity__c * prev.listPrice__c * prev.discountable__c * a
						}, 0)
						item2.discountAblePrice = discountAblePrice
					} else {
						item2.itemTotalPrice = 0
						item2.discountAblePrice = 0
					}
				})
				let a = item.groups.reduce((cur, prev) => {  //原价
					return cur + prev.itemTotalPrice
				}, 0)
				let b = item.groups.reduce((cur, prev) => {  //可打折
					return cur + prev.discountAblePrice
				}, 0)
				item.itemTotalPrice = a
				item.discountAblePrice = b
			} else {
				item.itemTotalPrice = 0
				item.discountAblePrice = 0
			}
		})
		//所有
		totalPrice1 = arr1.reduce((cur, prev) => {  //折扣前总价
			return cur + prev.itemTotalPrice
		}, 0)
		discountAbleTotal1 = arr1.reduce((cur, prev) => {  //折扣前可打折的物料总价
			return cur + prev.discountAblePrice
		}, 0)
	} else {
		totalPrice1 = 0
		discountAbleTotal1 = 0
	}
	let allTotal = totalPrice1 //  折前总原价
	let allDiscountTotal = discountAbleTotal1   //  折前可打折的总原价

	/*------tcx  1123  start -------
	let allTotalOfCannotDiscout=allTotal-allDiscountTotal;//所有不允许打折的
	// 差价=折前总价 - 折后总价
	// 差价分摊到可打折的物料上
	// 折扣 = 1-（差价/可打折的物料总原价）
	// let discountPrice = Math.abs(allTotal - val)  //差价
	// let discountPrice = allTotal - val  //差价
	let discountPrice=0;
	if(allTotalOfCannotDiscout==0){
		//说明所有物料都可以打折
		discountPrice = allDiscountTotal - val  //差价:用所有可打折物料折前总价-所有可打折物料折后总价
	}else{
		//说明只是部分物料允许打折
		discountPrice = allDiscountTotal - (val-allTotalOfCannotDiscout)  //差价:用所有可打折物料折前总价-所有可打折物料折后总价

	}
	-------tcx 1123 end-----------*/
	//1123 add start
	let discountPrice = allTotal - val
	//let discountPrice = allDiscountTotal - val // 20240813 母玉山 注释
	//1123 add end



	//	let discount = 1 - (discountPrice / allDiscountTotal)
	let discount = 0
	if (allDiscountTotal != 0) {
		discount = discountPrice / allDiscountTotal;
	}
	if (type == "硬件" && discount != null) {//硬件折扣
		vue.$data.discounts['hardWareDiscount__c'] = (discount).toFixed(4);
	} else if (type == "系统评估及服务" && discount != null) {//系统评估及服务折扣
		vue.$data.discounts['systemEvaluation__c'] = (discount).toFixed(4);
	} else if (type == "系统优化及服务" && discount != null) {//系统优化及服务折扣
		vue.$data.discounts['systemOptimization__c'] = (discount).toFixed(4);
	} else if (type == '软件' && discount != null) {//软件折扣
		vue.$data.discounts['softWareDiscount__c'] = (discount).toFixed(4);
	}
	return discount
}
var cascadeCalc = function () {
	Ex_Chassis_Quantity_Calc()
	// if(getItemValue('TSx_RemoteConnect')==true && a>3){ //不是级联的时候
	// 	let a=vue.$data.copyBlocks.length+1
	// 	let a2=0
	// 	if(a-3>0){
	// 		a2=a-3
	// 	}
	// 	let Ex_Chassis11=0
	// 	let ex_chassis_add = getItemValue(vue.$data.series + 'Ex_ChassisADD')||0
	// 	let localIOCardsQuantity = getAllLocalCardQuantity();//所有本地卡件数量
	// 	let main_slot=getItemInfo('TSx_Main_Chassis').slotCount__c||0; //主机架可用槽位数
	// 	let main_q=getItemQuantity('TSx_Main_Chassis')
	// 	let spc_q=getItemQuantity('TSx_CM_Module_Spec')
	// 	let all=main_q+spc_q
	// 	switch (all) {
	// 		case 1:
	// 			main_slot=main_slot+1
	// 			break;
	// 		case 4:
	// 			main_slot=main_slot-1
	// 			break;
	// 	}
	// 	let ex_slot=getItemInfo('TSx_Ex_Chassis').slotCount__c||8; //扩展机架可用槽位数
	// 	Ex_Chassis11=Math.ceil((localIOCardsQuantity-main_slot)/ex_slot)+ex_chassis_add
	// 	Ex_Chassis11=ex_chassis_tsx_calc(main_slot,Ex_Chassis11)
	// 	if(a2-Ex_Chassis11>0){
	// 		setItemQuantity('TSx_Ex_Chassis',a2)
	// 		setItemQuantity('TSx_IOBus_MFCM',a2*6)
	// 		setItemQuantity('TSx_IOBus_FJumper',a2*3)
	// 		setItemQuantity('TSx_IOBus_FJumper2',0)
	// 		let q=getItemQuantity('TSx_Main_Chassis')||0
	// 		setItemQuantity('TSx_PS_Module',(q+a2)*2)
	// 		setItemQuantity('TSx_IOBus_IM',(q+a2)*3)
	// 	}else{
	// 		Ex_Chassis_Quantity_Calc()
	// 	}
	// }else{
	// 	Ex_Chassis_Quantity_Calc()
	// }
}
var ospCalc = function (p, val) { //设置TSx_PI_Module的值
	let s = ''
	let l = ''
	if (p.indexOf('Remote') != -1) {
		s = 'Remote'
		if (p.indexOf('#') != -1 && isNumber(p.substring(p.length - 1))) {
			l = p.substring(p.length - 2)   //#1...2..3..
		}
	}
	let pointBuff = getItemValue('TSx_pointBuff') / 100
	let a = 0
	let n = 0
	let b = 0
	let slotCount = getItemInfo(vue.$data.series + s + 'PI_Module' + l).slotCount__c || 0
	if (p == 'TSx_' + s + 'PI_Points' + l) {
		a = getItemValue('TSx_' + s + 'OSP_Group' + l);
		// n=getItemValue('TSx_'+s+'OSP_Group'+l)
		n = getItemValue('TSx_' + s + 'PI_Points' + l)
		b = Math.ceil(n * (1 + pointBuff) / slotCount)
	} else if (p == 'TSx_' + s + 'OSP_Group' + l) {
		//a=val
		a = getItemValue('TSx_' + s + 'OSP_Group' + l);
		n = getItemValue('TSx_' + s + 'PI_Points' + l)
		b = Math.ceil(n * (1 + pointBuff) / slotCount)
	} else {
		a = getItemValue('TSx_' + s + 'OSP_Group' + l);
		n = getItemValue('TSx_' + s + 'PI_Points' + l)
		b = Math.ceil(n * (1 + pointBuff) / slotCount)
	}
	let add = getItemValue('TSx_' + s + 'PI_ModuleADD' + l)
	let c = a > b ? a : b
	c = c + add
	setItemQuantity('TSx_' + s + 'PI_Module' + l, c)
	let m = getItemInfo('TSx_' + s + 'PI_Module' + l).slotCount__c
	let m2 = getItemInfo('TSx_' + s + 'PI_ETP' + l).slotCount__c
	setItemQuantity('TSx_' + s + 'PI_ETP' + l, Math.ceil(c * m / m2))
	setItemQuantity('TSx_' + s + 'PI_Module2' + l, 0)
	setItemQuantity('TSx_' + s + 'PI_ETP2' + l, 0)
}
var priceCalc = function (type, val, arr, arr1) {  //折扣类型、目标额度、本地、远程
	let discount = averageDiscount(type, val, arr, arr1)
	//这里不能一刀切，界面加载不计算 但是用户输入整体目标折扣还是需要计算。
	if (arr1 && arr1.length) {
		arr1.forEach(item => {
			if (item.groups && item.groups.length) {
				item.groups.forEach(item2 => {
					if (item2.children && item2.children.length) {
						item2.children.forEach(item3 => {
							if (item3.discountable__c == 1 || item3.discountable__c == 'true') {
								if (item3.discountCategory__c == type) {
									if (item3.inFramework__c != 1) {
										item3.discount__c = (discount * 100).toFixed(2) + '%'
										//item3.discountPrice__c = (item3.listPrice__c * discount * item3.itemQuantity__c).toFixed(2)
										item3.discountPrice__c = (item3.listPrice__c * (1 - discount)).toFixed(2)
									}
								}
							} else {
								item3.discount__c = 0
								//item3.discountPrice__c = item3.listPrice__c*item3.itemQuantity__c
								item3.discountPrice__c = item3.listPrice__c
							}
						})
					}
				})
			}
		})
	}
}

/**
 * 根据主产品ID查询产品包信息
 * @param {String} mainProductId - 主产品ID（productPackage__c的外键mainProduct__c）
 * @returns {Promise} 返回查询到的records数组
 */
var queryProductPackage = function (mainProductId) {
	return new Promise(function (resolve, reject) {
		if (!mainProductId) {
			resolve([]);
			return;
		}
		let param = {};
		param.xoql = "select id,name,quantity__c from productPackage__c where mainProduct__c=" + mainProductId;
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
var priceAllTypeCalc = function () {
	debugger;
	this.steps.forEach(every => {
		if (every.groups && every.groups.length) {
			every.groups.forEach(item => {
				if (item.children && item.children.length) {
					item.children.forEach(item2 => {
						if (item2.discount__c === undefined) {
							item2.discount__c = 0;
						}
						if (item2.listPrice__c) {
							if (item2.discountPrice__c === '' || item2.discountPrice__c === undefined) {
								if (item2.discount__c && item2.discountable__c == 1 && vue.$data.bomEnable == false) {
									//item2.discountPrice__c=(item2.discount__c*item2.listPrice__c*item2.itemQuantity__c/100).toFixed(2)
									//item2.discountPrice__c=(item2.discount__c*item2.listPrice__c/100).toFixed(2)
									item2.discountPrice__c = ((1 - item2.discount__c) * item2.listPrice__c / 100).toFixed(2)
									item2.discount__c = (item2.discount__c * 100).toFixed(2) + '%'
								} else {
									//item2.discountPrice__c=item2.listPrice__c*item2.itemQuantity__c
									item2.discountPrice__c = item2.listPrice__c
									item2.discount__c = 0 + '.00%'
								}
							} else {
								item2.discountPrice__c = item2.discountPrice__c
								item2.discount__c = (item2.discount__c * 100).toFixed(2) + '%'
							}
						} else {
							item2.discount__c = (item2.discount__c * 100).toFixed(2) + '%'
							item2.discountPrice__c = 0
						}
						item2.listPrice__c = item2.listPrice__c.toFixed(2)
						if (item2.price__c != undefined) {
							item2.price__c = item2.price__c.toFixed(2)
						}
						item2.discountPrice__c = item2.discountPrice__c.toFixed(2)
					})
				}
			})
		}
	})
	vue.$data.typePrices = [];

	vue.$data.discountOptions.forEach(item => {
		let a = {}
		a.label = item.label
		a.value = item.value
		let b = calcAll(item.value, [], vue.$data.steps)
		let c = Object.assign(a, b)
		vue.$data.typePrices.push(c)
	})
	let ab = vue.$data.typePrices.reduce((cur, prev) => {
		if (prev.price == undefined) {
			prev.price = 0
		}
		return cur + prev.price
	}, 0)
	let c = vue.$data.allTotal - ab
	vue.$data.otherPrice = c
	vue.$data.typePrices.push({
		label: '其他',
		value: '9',
		price: c,
		discountPrice: c,
		aa: c
	})
	let allDiscount = 0
	for (let key in vue.$data.typePrices) {
		allDiscount += vue.$data.typePrices[key].aa;
	}
	//allDiscount+=Number(vue.$data.customItem304__c);//增加上运保费
	vue.$data.discountPrice = allDiscount
}
var ioCount = function (type) {
	let sum = 0
	let sum1 = 0
	let mArr = ['Module', 'Module2']
	let eArr = ['ETP', 'ETP1', 'ETP2']
	let tArr = ['DI_', 'DO_', 'AO_', 'AI_', 'PI_']
	let io = []
	let pointBuff = getItemValue(vue.$data.series + "pointBuff");//点数备用量
	//本地+远程1
	tArr.forEach(item => {
		if (item == 'PI') {
			io.push(item + 'Module', item + 'ETP')
			io.push('Remote' + item + 'Module', 'Remote' + item + 'ETP')
		} else {
			io.push(item + 'Module', item + 'Module2', item + 'ETP', item + 'ETP1', item + 'ETP2')
			io.push('Remote' + item + 'Module', 'Remote' + item + 'Module2', 'Remote' + item + 'ETP', 'Remote' + item + 'ETP1', 'Remote' + item + 'ETP2')
		}
	})
	//远程2，3.。。。。
	let remoteIo = []
	if (vue.$data.copyBlocks.length) {
		vue.$data.copyBlocks.forEach(item => {
			let str = item.id.substring(item.id.length - 2)
			io.forEach(item2 => {
				remoteIo.push(item2 + str)
			})
		})
	}
	//所有IO
	let allIo = [...io, ...remoteIo]
	let ioSum = []
	let ioSum2 = []
	allIo.forEach(item => {
		let a = undefined;
		if (vue.$data.itemApiKeys.hasOwnProperty(item)) {
			a = getItemQuantity(item);
		}
		let c = 0
		let mm = 0
		if (a === undefined) {
			if (vue.$data.defaultItems.length) {
				vue.$data.defaultItems.forEach(item2 => {
					if (item2.name == item) {
						if (type != undefined) {
							c = item2.itemQuantity__c * item2.slotCount__c
						} else {
							c = pointBuff * item2.slotCount__c
						}
						if (item2.slotCountPerCard__c && (item2.slotCountPerCard__c != undefined)) {
							mm = Number(item2.slotCountPerCard__c) > 0 ? item2.itemQuantity__c * Number(item2.slotCountPerCard__c) : 0
						}
					}
				})
			}
		} else {
			let productInfo = getItemInfo(item);
			if (productInfo != undefined) {
				let b = productInfo == undefined ? 0 : productInfo.slotCount__c
				if (type != undefined) {
					c = a * b
				} else {
					c = pointBuff * productInfo.slotCount__c
				}
				if (productInfo.slotCountPerCard__c && (productInfo.slotCountPerCard__c != undefined)) {
					mm = Number(productInfo.slotCountPerCard__c) > 0 ? a * Number(productInfo.slotCountPerCard__c) : 0
				}
			}
		}
		ioSum.push(c)
		ioSum2.push(mm)
	})
	//总数
	sum = ioSum.reduce((cur, prev) => {
		return cur + prev
	})
	if (ioSum2.length) {
		sum1 = ioSum2.reduce((cur, prev) => {
			return cur + prev
		})
	}
	if (type == 'countPerCard') {
		return sum1
	} else {  //备用量   输入的点数*备用量    不用乘以数量了
		return sum
	}
}

/**
 * 根据主产品ID查询产品包信息
 * @param {String} mainProductId - 主产品ID（productPackage__c的外键mainProduct__c）
 * @returns {Promise} 返回查询到的records数组
 */
var queryProductPackage = function (mainProductId) {
	return new Promise(function (resolve, reject) {
		if (!mainProductId) {
			resolve([]);
			return;
		}
		let param = {};
		param.xoql = "select id,name,quantity__c from productPackage__c where mainProduct__c=" + mainProductId;
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
//判断是否是执行订单
function performOr() {
	vue.$data.isOrderOr = false;
	let rconfig = {
		method: 'get',
		url: "/rest/data/v2/query?q=select id,customItem215__c,customItem233__c,customItem272__c from _order where id=" + vue.$data.orderId + " and customItem215__c=3",
		contentType: 'application/json'
	};
	// lapp.connection.invoke(rconfig).then(function(res){
	// 	if(res.data && res.data.code==200){
	// 		if(res.data.result && res.data.result.records && res.data.result.records.length){
	// 			vue.$data.isOrderOr=true
	// 			getFrameItems(res.data.result.records[0]["customItem272__c"])
	// 		}else{
	// 			vue.$data.isOrderOr=false
	// 		}
	// 	}
	// })
}
//bom展示的时候，判断哪些可以编辑名称
function findNameEditAble() {
	vue.$data.configNameEdit = []
	let config = {
		method: 'get',
		url: "/rest/data/v2/query?q=select productCode__c,notesEnable__c from product__c where notesEnable__c=true",
		contentType: 'application/json'
	};
	lapp.connection.invoke(config).then(function (res) {
		if (res.data && res.data.code == 200) {
			if (res.data.result && res.data.result.records && res.data.result.records.length) {
				res.data.result.records.forEach(item => {
					vue.$data.configNameEdit.push(item.productCode__c)
				})
			}
		} else {
			vue.$data.message.warning(res.data.msg)
		}
	})
}
function minusRemoteTag(id) {
	if (vue.$data.configId != null && vue.$data.configId != "") {
		return new Promise((resolve, reject) => {
			showLoading()
			let config = {
				method: 'get',
				url: "/rest/data/v2.0/scripts/api/neocrm/bom/deleteRemote?configId=" + vue.$data.configId + "&remoteStepId=" + encodeURIComponent(id),
				contentType: 'application/json'
			};
			lapp.connection.invoke(config).then(function (res) {
				hideLoading()
				if (res.data && res.data.code == 200) {
					vue.$message.success('删除成功')
					resolve('success')
				} else {
					vue.$data.message.warning(res.data.msg)
					resolve('false')
				}
			}).catch(function (err) {
				hideLoading()
				vue.$message.error(err)
				reject(err)
			})
		});
	} else {
		return new Promise((resolve, reject) => {
			resolve('success');
		});

	}

}
function getAllClick(flag) {
	return new Promise(function (resolve, reject) {
		let a = true
		for (let key in vue.$data.configblocks) {
			if (key.indexOf('#') != -1) {
				if (!vue.$data.configblocks[key].length) {
					a = false
				} else {
					if (vue.$data.loadedBlockIds.indexOf(vue.$data.configblocks[key][0].id) == -1) {
						a = false
					}
				}

			}
		}
		if (a == false && (flag != 1)) {
			vue.$data.remoteTip = true
			vue.$message.error('还有远程数据未加载,请手动点开远程配置步骤')
			resolve('false')
			return false
		} else {
			vue.$data.remoteTip = false
			resolve('success')
		}
	})
}
function deepClone(obj) {
	if (obj == null) {
		return null
	}
	var result = Array.isArray(obj) ? [] : {};
	for (let key in obj) {
		if (obj.hasOwnProperty(key)) {
			if (typeof obj[key] === 'object') {
				result[key] = deepClone(obj[key]);
			} else {
				result[key] = obj[key];
			}
		}
	}
	return result;
}
//删除远程, 远程步骤重新排序,配置项重新排序,物料重新排序
function deleteRemote(item) {
	let i = item.id.indexOf('#')
	let a = 0
	a = Number(item.id.split('#')[1])
	delete vue.$data.configblocks['configblock_' + item.id]
	for (let key in vue.$data.configblocks) {
		if (key.indexOf('#') != -1) {
			let m = Number(key.split('#')[1])
			if (m > a) {
				if (vue.$data.configblocks[key] && vue.$data.configblocks[key].length && Array.isArray(vue.$data.configblocks[key])) {
					vue.$data.configblocks[key].forEach(itemin => {
						itemin.id = itemin.id.split('_')[0] + '_' + (m - 1)
					})
					let arr = key.split('#')
					vue.$data.configblocks[arr[0] + '#' + (m - 1)] = deepClone(vue.$data.configblocks[key])
					delete vue.$data.configblocks[key]
				}
			}
		}
	}
	for (let key2 in vue.$data.itemApiKeys) {
		if (key2.indexOf('#') != -1) {
			let n = Number(key2.split('#')[1])
			if (n == a) {
				delete vue.$data.itemApiKeys[key2]
			}
		}
	}
	for (let key2 in vue.$data.itemApiKeys) {
		if (key2.indexOf('#') != -1) {
			let p = Number(key2.split('#')[1])
			if (p > a) {
				let carr = key2.split('#')  //itemValue::1525270285992905_2::1539475045073893#2
				let ckey = carr[0] + '#' + (p - 1)
				let m = vue.$data.itemApiKeys[key2].split('_')[0]  //itemValue::1525270285992905
				let n = vue.$data.itemApiKeys[key2].split('_')[1].split('::')[1] //1539475045073893#2
				let q = n.split('#')[0] //1539475045073893
				vue.$data.itemApiKeys[ckey] = m + '_' + (p - 1) + '::' + q + '#' + (p - 1)
				delete vue.$data.itemApiKeys[key2]
			}
		}
	}
	vue.$data.configSteps.forEach(item => {
		let s = Number(item.id.split('#')[1])
		if (s > a) {
			item.id = item.id.split('#')[0] + '#' + (s - 1)
		}
	})
}
//获取当前订单下已经配置的第三方配置物料
function querThirdParts(blockId, itemId) {
	let rconfig = {
		method: 'get',
		url: "/rest/data/v2.0/scripts/api/neocrm/bom/query/thirdpart?orderId=" + vue.$data.orderId,
		contentType: 'application/json'
	};
	lapp.connection.invoke(rconfig).then(function (res) {
		if (res.data && res.data.code == 200) {
			if (res.data.records && res.data.records && res.data.records.length) {
				let array = []
				array = vue.$data.itemValues['itemValue::' + blockId + '::' + itemId];
				if (array == undefined) {
					array = []
				} else {
					array = res.data.records;
				}
				vue.$data.itemValues['itemValue::' + blockId + '::' + itemId] = array
			} else {
				vue.$message.error('没有加载到任何第三方配置，请点击「追加第三方物料」按钮增加')
			}
		}
	});
}

/**
*查询厂商列表，从物料对象上获取字段vendor__c的下拉列表数据
*/
function queryVendors() {
	var config = {
		method: 'get',
		url: '/rest/data/v2.0/xobjects/product__c/description',
		contentType: 'application/json'

	};
	lapp.connection.invoke(config).then(function (response) {
		if (response.data && response.data.code === '200') {
			let fields = response.data.data.fields;
			fields.forEach((field, index, originalArr) => {
				if (field.apiKey == "vendor__c") {
					let selectitems = field['selectitem'];
					let vendorList = [];
					selectitems.forEach((item, index, org) => {
						let vendor = {};
						vendor["value"] = item["label"];
						vendor["label"] = item["label"];
						vendorList.push(vendor);
					});
					vue.$data.vendors = vendorList;
				}
			});
		}
	}).catch(function (error) {
		console.log(error);
	});
}

/**
 * 查询 Bomconfig__c 对象的 configType__c 字段的下拉列表数据
 */
function queryConfigTypeOptions() {
	lapp.connection.invoke({
		url: '/rest/data/v2.0/xobjects/BomConfig__c/description', // 接口地址
		method: 'get', // 请求类型 GET DELECT POST PUT (大小写随意，请求方法会转大写)
		contentType: 'application/json',// 请求方式 application/json、application/x-www-form-urlencoded、multipart/form-data
		//headers:headers, // 请求头   请填写 json 格式数据
		//params:params,  // params  请填写 json 格式数据，请求方法会拼接在 url 后 
		//data:data      // 请求体    请填写 json 格式数据
	}).then(
		response => {
			debugger;
			console.log('[queryConfigTypeOptions] response:', response.data);
			console.log('[queryConfigTypeOptions] code:', response.data && response.data.code, 'type:', typeof (response.data && response.data.code));
			if (response.data && (response.data.code === '200' || response.data.code === 200)) {
				let fields = response.data.data.fields;

				// 遍历字段数组，找到 configType__c 字段
				fields.forEach((field, index, originalArr) => {
					if (field.apiKey === "configType__c") {
						let selectitems = field['selectitem'];
						let configTypeList = [];

						// 解析下拉选项
						selectitems.forEach((item, index, org) => {
							let configType = {};
							configType["value"] = item["value"];
							configType["label"] = item["label"];
							// 如果需要有其他属性，也可以从 item 中获取
							configType["code"] = item["apiKey"];
							configTypeList.push(configType);
						});

						// 将结果存储到 vue 数据中
						vue.$data.configTypes = configTypeList;

						// configTypes加载完成后再查询配置类型
						queryconfigTypes();

					}
				});
			}
		},
		err => {
			debugger;
			console.log(err);// 打印失败的返回结果
		}
	)
}
