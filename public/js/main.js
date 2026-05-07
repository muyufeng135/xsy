var vue = new Vue({
    el: '#app',
    data: {
        transferFormat: {
            noChecked: '$' + '{total}',
            hasChecked: '$' + '{checked}/$' + '{total}'
        },
        userAgent: '',
        remoteTip: true,
        lockStatus: false,
        enableCalc: true,
        bomEnable: true,   //bom中输入框的控制
        userType: true, //区分售前、售后    true:售前   false:售后
        discountAble: true, //折后价输入框是否允许输入
        inFramework: true, //是否框架内产品  true是    false不是
        activeTab: '',
        accordion: true,
        dynamicTags: ["远程系统配置"],//动态第三方配置参数。默认名
        inputVisible: false,//第三方配置页签输入框显示/隐藏控制
        inputValue: '',//第三方配页签输入框值
        addTagVisible: false, //增加远端配置弹窗
        copyId: '', //复制的区块名称
        copyBlocks: [], //复制的区块
        addNum: 0, //最多复制9个
        loading: true,
        bomShow: false,  //BOM页面
        activeBom: ['setting'], //BOM预览中展开的collapse
        remoteHeight: 0,
        bomDataOfLocal: [], //bom本地配置数据
        bomDataOfRemotes: {}, //bom远程配置数据
        steps: [],
        totalCardPoint: 0, //订单下所有配置卡件点数总和,默认一个 防止出现没有配置卡件的情况为0 导致项目管理及服务类(物料BOM顺序号25.xxx)金额计算为0
        totalRequirePoint: 0, //订单下所有配置填写的需要的点数
        configNames: [],
        customItem304__c: 0,//运保费
        currentColumnFlag: '', //当前在编辑的列
        drawTableKey: 0, //用于bomdata变化刷新table
        configName: "",
        configTypeId: "",
        configType: 1,
        defaultItems: [],
        editConfigItemsId: {},//当进行编辑操作时这里存放配置项名称对应的id
        defaultSteps: '',
        systemType: '',
        projectType: '',
        mpdLimits: [],
        customType: '',
        seriesType: '',
        copyItem: {},
        series: '',
        tcs: {},
        copyInfo: {},
        configSteps: [],//配置步骤
        configblocks: {},//配置区块
        srcBlockId: '',
        configForms: {},//每一个配置区块对应一个form
        configItems: {},//配置区块下的配置项目
        configItemRecords: {},//以itemName作为key的配置项，方便使用
        configItemsEnable: {},//配置开关项控制的内容的启用和禁用。
        selectItemDataSource: {},//配置区块下的选择框项目的数据源
        selectItemDataSourceNew: {}, //下拉框搜索时  配置区块下的选择框项目的数据源
        casecadeItemDataSource: {},//配置区块下的级联选择框项目的数据源
        itemApiKeys: {},//存放每一个配置项在itemValues中的存放的值的key,这样就能根据后太配置的name属性中的key拿到页面中对应组件的存值的key 进而拿到数值。类似于js 中 documen.getEelmentById()
        itemValues: {},//整个页面中的所有配置项的值
        disables: [],//输入框disabled属性
        seDisables: [], //下拉框disable
        itemQuantityValues: {},//整个页面中所有配置项对应的数量值
        itemError: {}, //整个页面中所有配置项对应的错误提示
        loadedBlockIds: [],//已经加载过配置项的配置区块
        loadedStepIds: [],//已经加载过配置项的配置步骤
        showInMiniWindow: [],//用来展示在右上角小窗体的配置项
        sparesQuantity: {},//备件物料数量
        refrenceMap: {},//配置项间的相互依赖关系
        referenceDataSource: {},//依赖配置数据源
        referenceDefaultValue: {},//依赖配置默认值
        spanArr: [], //bom表格单元格合并数组
        preParam: "",//预配置界面传入的参数
        headerArray: [],//第三方物料表格组件的表个头
        configId: '',//当前界面展现的BomConfig 数据ID
        orderId: '',//当前界面展现的配置对应的Order数据ID
        discountOptions: [{ label: '硬件', value: '硬件' }, { label: '软件', value: "软件" }, { label: '系统评估及服务', value: '系统评估及服务' }, { label: '系统优化及服务', value: "系统优化及服务" }],
        targetPrices: {},
        discounts: {},//硬件折扣，系统评估及服务折扣，系统优化及服务折扣
        srcConfigId: '',
        settings: { discountType: '' },
        spareFlags: [],
        allTotal: 0,
        discountPrice: 0,
        typePrices: [],
        switchFlag: false,  //目标折扣允许输入时，折后价不允许输入 该值的取值取决于订单上 是否是config配置的值
        otherPrice: 0,
        minute: 5,   //自动保存时间 单位：分
        enableAutoCalc: 'false',
        configInputAble: true,  //配置是否可编辑
        discountInputAble: true, //折扣价格是否可编辑
        isOrderOr: false, //是否是执行订单
        duanpei: '',
        duanpeiUserId: '1659394644706350',
        TcCardCode: '01-01-01-07-00-04',
        AICardCode: '01-01-01-07-00-04',
        oldAiCode: '',
        currencyUnit: '',  //币种
        customType__c: '',  //客户类型 1国内客户  2国际客户
        frameItems: [],  //框架内物料给予特殊颜色区分
        configNameEdit: [],  //bom展示中可以编辑名称的物料
        Chassis_Sum: 0,
        isShowCurrnt: false,
        vendors: []
    },
    watch: {
        targetPrices: {
            handler(val, oldVal) {
                this.discountPrice = 0
                this.typePrices.forEach(item => {
                    for (let key in val) {
                        if (item.value == key) {
                            //item.discountPrice=Number(val[key])
                            item.aa = Number(val[key])
                        }
                    }
                    console.log(item.aa)
                    // this.discountPrice+=Number(item.discountPrice)
                    this.discountPrice += Number(item.aa)
                })
            },
            deep: true
        }
    },
    mounted() {
        this.filterBrowser();
        if (getQueryString('enableAutoCalc')) {
            this.enableAutoCalc = getQueryString('enableAutoCalc')
        }
        this.duration = getQueryString('userId');
        if (this.switchFlag == false) {
            this.settings['discountType'] = "系统评估及服务";
        } else {
            this.settings['discountType'] = "硬件";
        }
    },
    directives: {
        focus: {
            // 指令的定义
            inserted: function (el) {
                // 聚焦元素
                el.querySelector('input').focus()
            }
        },
        numberOnly: {
            bind: function (el) {
                el.handler = function () {
                    el.children[1].value = el.children[1].value.replace(/[^\d{1,}\.\d{1,}|\d{1,}]/g, '').replace(/^0{1,}/g, '')
                }
                el.addEventListener('input', el.handler)
            },
            unbind: function (el) {
                el.removeEventListener('input', el.handler)
            }
        }
    },
    methods: {
        doTable(step) {
            let that = this
            that.$nextTick(() => {
                if (that.$refs[step[step.length - 1] + 'table']) {
                    that.$refs[step[step.length - 1] + 'table'][0].doLayout();
                }
            })
        },
        comdify(n) {
            var re = /\d{1,3}(?=(\d{3})+$)/g;
            var n1 = n.replace(/^(\d+)((\.\d+)?)$/, function (s, s1, s2) {
                return s1.replace(re, "$&,") + s2;
            });
            return n1;
        },
        filterBrowser() {
            var userAgent = navigator.userAgent;
            if (userAgent.indexOf("Chrome") == -1) {
                this.userAgent = 'other'
            }
        },
        rowKey(row) {  //table渲染优化
            return row.orderNo + row.id
        },
        filter(val, list, blockId, item) {
            if (val) {
                this.selectItemDataSourceNew["configItemDataSource_" + blockId + "_" + item.id] = list.filter(item => {
                    if (!!~item.label.indexOf(val) || !!~item.label.toUpperCase().indexOf(val.toUpperCase())) {
                        return true
                    }
                    if (item.remark && item.remark.length) {
                        let a = false
                        item.remark.forEach(item2 => {
                            if (!!~item2.value.indexOf(val) || !!~item2.value.toUpperCase().indexOf(val.toUpperCase())) {
                                a = true
                            }
                        })
                        return a
                    }
                })
            } else {
                this.selectItemDataSourceNew["configItemDataSource_" + blockId + "_" + item.id] = this.selectItemDataSource["configItemDataSource_" + blockId + "_" + item.id];
            }
        },
        tablePriceEdit(row) {  //行内成本价、表价
            //判断逻辑描述:默认可编辑，
            //根据订单审批状态和报价阶段判断字段的值 得到一个折扣是否允许编辑的结果discountInputAble
            // 1、如果discountInputAble =false 并且当前操作人不是段培 则不可编辑折扣
            //2、如果discountInputAble=true 进一步判断如果是框架内产品row.inFramework__c == 1则不可编辑折扣
            //3、如果discountInputAble=true 且物料是框架外的物料且可打折的discountable__c=1
            let a = false
            if (this.discountInputAble == false && this.duanpei != this.duanpeiUserId) {
                a = true
            } else {
                if (row.inFramework__c == 1) {
                    a = true
                } else {
                    if (row.discountable__c == 'true' || row.discountable__c == 1) {
                        if (this.duanpei == this.duanpeiUserId) {
                            a = false
                        } else {
                            a = true
                        }
                    } else {
                        if (this.duanpei == this.duanpeiUserId) {
                            a = false
                        } else {
                            a = true
                        }
                    }
                }
            }

            return a;
        },
        tablePriceEditDiscount(row) {  //行内折后价的编辑权限
            let a = false
            if (this.discountInputAble == false && this.duanpei != this.duanpeiUserId) {
                a = true
            } else {
                if (row.inFramework__c == 1) {
                    a = true
                } else {
                    if (row.discountable__c == 'true' || row.discountable__c == 1) {

                        if (this.duanpei == this.duanpeiUserId) {
                            a = false
                        } else if (vue.$data.isOrderOr)//如果是执行订单则框架外的可打折物料的折后价可编辑
                        {
                            a = false
                        } else {
                            if (this.switchFlag == true) { //是config配置时
                                a = true
                            } else {
                                if (row.discountCategory__c == '硬件') {
                                    a = false
                                } else {
                                    a = true
                                }
                            }
                        }
                    } else {
                        a = true
                    }
                }
            }
            return a;
        },
        //计算折扣
        discount(val) {
            priceCalc(this.settings['discountType'], val, [], this.steps)
        },
        //获取指定配置步骤的配置区块数组
        getBlocks(stepId) {
            return this.configblocks["configblock_" + stepId];//此处使用方括号方式取值不能使用点取值
        },
        //获取配置项
        getItems(blockId) {
            // var items=this.configItems["configitem_"+blockId];
            return this.configItems["configitem_" + blockId];//此处使用方括号方式取值不能使用点取值
        },
        getFirstImageUrl(imageUrls) {
            var array = imageUrls.split(';');
            return array[0];
        },
        getPreImageUrls(imageUrls) {
            var array = imageUrls.split(';');
            return array;
        },
        getFormModel(blockId) {
            return this.configForms["configform_" + blockId];
        },
        loadData(blockId, item, type) {
            if (type == 8) {
                return this.selectItemDataSource["configItemDataSource_" + blockId + "_" + item.id];
            } else {
                return this.selectItemDataSource["configItemDataSource_" + blockId + "_" + item.id];
            }
        },
        //tab切换触发
        tabToggle(tab) {
            let tabName = tab.name;
            let stepId = tabName.split("_")[1];
            let that = this
            queryconfigBlocks(stepId).then(function (res) {
                if (stepId.indexOf('#') != -1) {
                    let a = that.configblocks["configblock_" + stepId]
                    let arr = []
                    arr[0] = a[0].id
                    that.loadConfigItems(arr, 'true').then(function (res) {
                        local_calc()
                    })
                } else {
                    let a = that.configblocks["configblock_" + stepId]
                    let arr = []
                    arr[0] = a[0].id
                    that.loadConfigItems(arr, 'true').then(function (res) {
                        local_calc()
                    })
                }
            })
        },
        //根据区块ID加载某一区块的配置项,由于无法直接获得当前展开的配置区块，
        //采取遍历判断的方式进行加载，第一次点开的时候加载，如果已经加载就不进行二次加载。
        loadConfigItems(arr, flag) {
            return new Promise((resolve, reject) => {
                arr.forEach(function (blockId) {
                    if (blockId) {
                        if (vue.loadedBlockIds.includes(blockId)) {
                            console.info("已加载：" + blockId + ",不进行二次加载");
                            resolve('success')
                        } else {
                            console.log(vue.$data.loadedBlockIds)
                            queryConfigItems(blockId + "", flag).then(res => {
                                vue.loadedBlockIds.push(blockId);
                                resolve(res)
                            }).catch(err => {
                                reject(err)
                            });//转成字符串方便方法内部处理
                        }
                    }
                });
            })

        },
        //针对单选框物料包含图片的让图片在选择框右侧显示。
        selectValueChage(value, blockId, item) {
            debugger;
            let itemInfo = getItemInfo(item.name);
            if (itemInfo.hasOwnProperty("imageUrls__c")) {
                item.imageUrls__c = itemInfo.imageUrls__c;
            } else {
                item.imageUrls__c = "";
            }
            if (item.customizeDataSource__c && item.customizeDataSource__c != '') {
                let that = this;
                customDataSourceItemRefrenceChange(value, blockId, item).then(function (res) {
                    that.selectChange(item.name)
                    // setTimeout(function(){
                    // },300);
                });
            } else {
                //获取所有依赖了当前变更选择的下拉框的组件
                let urlMap = getRefrenceItemsInUrlMap(item, value);
                let that = this;
                refrenceItemChange(urlMap).then(function (res) {
                    if (res == true) {
                        that.selectChange(item.name)
                    }
                });
            }

        },
        //查询BOM
        createBom() {
            queryOrderBomView(false);
            findNameEditAble()
            performOr()
        },
        createBom1() {
            queryOrderBomView(true);
            findNameEditAble()
            performOr()
        },
        showEdit(step) {
            if (step.copyAble__c == 1 || step.isCopy) {
                this.$set(step, 'editFlag', true)
                if (step.name.substring(step.name.length - 4) == '(远程)') {
                    step.name = step.name.substring(0, step.name.length - 4)
                }
                let a = this.dynamicTags.indexOf(step.name)
                this.dynamicTags.splice(a, 1)
            }
        },
        editBlockName(step) {
            let name = step.name
            if (!step.name) {
                vue.$message.info("远端配置名称不能为空");
                return false;
            }
            if (this.dynamicTags.indexOf(name) > -1) {
                vue.$message.info("远端配置名称不允许重复");
                return false;
            }
            if (step.name.indexOf('(远程)') == -1) {
                name += '(远程)'
            } else {  //判断最后4个字符是不是 '(远程)'
                let str = name.substr(name.length - 4, 4)
                if (str != '(远程)') {
                    name += '(远程)'
                }
            }
            this.$set(step, 'name', name)
            this.$set(step, 'editFlag', false)
            this.dynamicTags.push(name.substring(0, name.length - 4))
        },
        addTag(stepId) {
            if (this.copyBlocks.length > 8) {
                vue.$message.warning('最多添加9个哦！');
                return false
            }
            this.inputValue = '';
            this.addTagVisible = true;
            this.copyId = stepId
        },
        minusTag(item) {
            let that = this
            that.$confirm('确认删除将不可恢复,是否删除?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'error'
            }).then(() => {
                getAllClick().then(function (res) {
                    if (res == 'success') {
                        minusRemoteTag(item.id).then(function (res) {
                            if (res == 'success') {
                                // window.location.reload();
                                let n = that.configSteps.indexOf(item)
                                that.configSteps.splice(n, 1)
                                let m = that.copyBlocks.indexOf(item)
                                that.copyBlocks.splice(m, 1)
                                let mq = item.name
                                mq = mq.replace('(远程)', '')
                                that.dynamicTags.splice(that.dynamicTags.indexOf(mq), 1);
                                let tagNum = 0
                                if (item.id.length) {
                                    tagNum = Number(item.id.substring(item.id.length - 1))
                                }

                                let a = that.loadedStepIds.indexOf(item.id)
                                that.loadedStepIds.splice(a, 1)
                                minusDisAbles(tagNum)
                                //  that.activeTab='tab_'+that.configSteps[0].id
                                deleteRemote(item)
                                local_calc()
                            } else {
                                that.$message.warning('删除失败')
                            }
                        }).catch(err => {
                            that.$message.error(err)
                        })
                    }
                })

            }).catch(() => {
                return;
            });

        },
        closeAdd() {
            this.addTagVisible = false;
            this.inputValue = ''
            this.copyId = ''
        },
        showInput() {
            this.inputVisible = true;
        },
        loadTableHeader(tableHeader__c) {
            let headerStrArray = tableHeader__c.split(",");
            let headerArray = [];
            headerStrArray.forEach(function (headerStr) {
                let header = {};
                header['prop'] = headerStr.split("=")[0];
                header['label'] = headerStr.split("=")[1];
                headerArray.push(header);
            });
            this.headerArray = headerArray
            return headerArray;
        },
        fillThirdPart(blockId, itemId) {
            querThirdParts(blockId, itemId);
        },
        appendRow(blockId, itemId) {
            let array = []
            array = this.$data.itemValues['itemValue::' + blockId + '::' + itemId];
            if (array == undefined) {
                array = []
            }
            let product = {};
            this.headerArray.forEach(item => {
                product[item.prop] = ''
            })
            array.push(product);
            this.$data.itemValues['itemValue::' + blockId + '::' + itemId] = array
        },
        deleteRow(blockId, itemId, index) {
            let array = this.$data.itemValues['itemValue::' + blockId + '::' + itemId];
            array.splice(index, 1);
        },
        handleInputConfirm() {
            let inputValue = this.inputValue;
            if (inputValue) {
                if (this.dynamicTags.indexOf(inputValue) > -1) {
                    vue.$message.info("远端配置名称不允许重复");
                    return;
                } else {
                    this.dynamicTags.push(inputValue);
                    doCopyBlock(1);//处理区块拷贝
                    let that = this
                    queryconfigBlocks(that.copyItem.id, 'true').then(function (res) {

                        let a = that.configblocks["configblock_" + that.copyItem.id]
                        let arr = []
                        arr[0] = a[0].id
                        that.loadConfigItems(arr, 'true')
                    })
                }
            } else {
                vue.$message.info("远端配置名称不能为空");
                return false;
            }
            this.addTagVisible = false;
        },
        showConfigInputParam() {
            let html = "";
            let t = this;
            this.$data.showInMiniWindow.forEach(function (item) {
                html += "<div style='font-size:12px; display:inline-block;text-align:left; border-bottom:1px dashed #EBEEF5;'>" + item.label + ":&nbsp;&nbsp;" + item.value + "&nbsp;&nbsp;</div>"
            })
            this.$notify({
                title: '系统基础信息',
                dangerouslyUseHTMLString: true,
                message: html,
                duration: 0
            });
        },
        filterMethod(query, item) {
            if (item.label.toUpperCase().indexOf(query.toUpperCase()) > -1) {
                return item.label.toUpperCase().indexOf(query.toUpperCase()) > -1;
            } else {
                let a = false
                if (item.remark && item.remark.length) {
                    item.remark.forEach(itemIn => {
                        if (itemIn.value.indexOf(query) > -1) {
                            a = true
                        }
                    })
                }
                return a
            }
        },
        numChange(p, val) {   //点数输入框
            if (!val) {
                setItemValue(p, 0)
            }
            if (this.enableAutoCalc == 'false') {
                return false;
            }
            let s = ''  //是否远程  ‘Remote'
            let l = ''   //是否复制模块 ’#1.....'
            let n = 0
            let DIPointsStr = 'DIPoints'
            let DOPointsStr = 'DOPoints'
            let AIPointsStr = 'AIPoints'
            let AOPointsStr = 'AOPoints'
            let PIPointsStr = 'PIPoints'
            if (p.indexOf('Remote') != -1) {
                s = 'Remote'
                if (p.indexOf('#') != -1 && isNumber(p.substring(p.length - 1))) {
                    n = Number(p.substring(p.length - 1))
                    l = p.substring(p.length - 2)   //#1...2..3..
                }
            }
            if (this.series != '') {
                DIPointsStr = this.series + s + 'DI_Points' + l
                if (this.series == 'CX_') {
                    DOPointsStr = this.series + s + 'DOPoints' + l    //物料英文名称需修改
                    AOPointsStr = this.series + s + 'AO_Points' + l    //物料英文名称需修改
                } else {
                    DOPointsStr = this.series + s + 'DO_Points' + l  //物料英文名称需修改
                    AOPointsStr = this.series + 'AOPoints' + l    //物料英文名称需修改
                }
                AIPointsStr = this.series + s + 'AI_Points' + l
                PIPointsStr = this.series + s + 'PI_Points' + l
            }
            if (p == this.series + 'slotBuff') {
                local_calc()
            }

            if (p.indexOf('pointBuff') != -1) {
                //本地
                numCalc(DIPointsStr, { m: this.series + 'DI_Module', e: [this.series + 'DI_ETP', this.series + 'DI_ETP1'] }, { m: this.series + 'DI_Module2', e: [this.series + 'DI_ETP2'] })
                numCalc(DOPointsStr, { m: this.series + 'DO_Module', e: [this.series + 'DO_ETP', this.series + 'DO_ETP1'] }, { m: this.series + 'DO_Module2', e: [this.series + 'DO_ETP2'] })
                numCalc(AIPointsStr, { m: this.series + 'AI_Module', e: [this.series + 'AI_ETP', this.series + 'AI_ETP1'] }, { m: this.series + 'AI_Module2', e: [this.series + 'AI_ETP2'] }, this.series + 'hasTCValue')
                if (this.series == '') {
                    aoCardCalc('AOPoints')
                } else {
                    numCalc(AOPointsStr, { m: this.series + 'AO_Module', e: [this.series + 'AO_ETP', this.series + 'AO_ETP1'] }, { m: this.series + 'AO_Module2', e: [this.series + 'AO_ETP2'] })
                }
                if (vue.$data.series == 'TSx_') {
                    numCalc(PIPointsStr, { m: this.series + s + 'PI_Module' + l, e: [this.series + s + 'PI_ETP' + l] }, { m: this.series + s + 'PI_Module2' + l, e: [this.series + s + 'PI_ETP2' + l] })
                    if (getItemValue('TSx_' + s + 'OSP_Enable' + l) == true && getItemQuantity('TSx_' + s + 'OSP_Group' + l) != 0) {
                        ospCalc('TSx_' + s + 'OSP_Group' + l, getItemQuantity('TSx_' + s + 'OSP_Group' + l))
                    }
                } else {
                    numCalc(PIPointsStr, { m: this.series + 'PI_Module', e: [this.series + 'PI_ETP'] })
                }
                //远程
                numCalc(this.series + 'RemoteDI_Points', { m: this.series + 'RemoteDI_Module', e: [this.series + 'RemoteDI_ETP', this.series + 'RemoteDI_ETP1'] }, { m: this.series + 'RemoteDI_Module2', e: [this.series + 'RemoteDI_ETP2'] })
                numCalc(this.series + 'RemoteDO_Points', { m: this.series + 'RemoteDO_Module', e: [this.series + 'RemoteDO_ETP', this.series + 'RemoteDO_ETP1'] }, { m: this.series + 'RemoteDO_Module2', e: [this.series + 'RemoteDO_ETP2'] })
                numCalc(this.series + 'RemoteAI_Points', { m: this.series + 'RemoteAI_Module', e: [this.series + 'RemoteAI_ETP', this.series + 'RemoteAI_ETP1'] }, { m: this.series + 'RemoteAI_Module2', e: [this.series + 'RemoteAI_ETP2'] }, this.series + 'RemotehasTCValue')
                if (this.series == '') {
                    aoCardCalc('RemoteAO_Points')
                } else {
                    numCalc(this.series + 'RemoteAO_Points', { m: this.series + 'RemoteAO_Module', e: [this.series + 'RemoteAO_ETP', this.series + 'RemoteAO_ETP1'] }, { m: this.series + 'RemoteAO_Module2', e: [this.series + 'RemoteAO_ETP2'] })
                }
                if (vue.$data.series == 'TSx_') {
                    numCalc(PIPointsStr, { m: this.series + s + 'PI_Module' + l, e: [this.series + s + 'PI_ETP' + l] }, { m: this.series + s + 'PI_Module2' + l, e: [this.series + s + 'PI_ETP2' + l] })
                } else {
                    numCalc(this.series + 'RemotePI_Points', { m: this.series + 'RemotePI_Module', e: [this.series + 'RemotePI_ETP'] })
                }
                if (this.copyBlocks.length > 0) {
                    this.copyBlocks.forEach((item, index) => {
                        let n = item.id.substring(item.id.length - 2)
                        numCalc(this.series + 'RemoteDI_Points' + n, { m: this.series + 'RemoteDI_Module' + n, e: [this.series + 'RemoteDI_ETP' + n, this.series + 'RemoteDI_ETP1' + n] }, { m: this.series + 'RemoteDI_Module2' + n, e: [this.series + 'RemoteDI_ETP2' + n] })
                        numCalc(this.series + 'RemoteDO_Points' + n, { m: this.series + 'RemoteDO_Module' + n, e: [this.series + 'RemoteDO_ETP' + n, this.series + 'RemoteDO_ETP1' + n] }, { m: this.series + 'RemoteDO_Module2' + n, e: [this.series + 'RemoteDO_ETP2' + n] })
                        numCalc(this.series + 'RemoteAI_Points' + n, { m: this.series + 'RemoteAI_Module' + n, e: [this.series + 'RemoteAI_ETP' + n, this.series + 'RemoteAI_ETP1' + n] }, { m: this.series + 'RemoteAI_Module2' + n, e: [this.series + 'RemoteAI_ETP2' + n] }, this.series + 'RemotehasTCValue' + n)
                        if (this.series == '') {
                            aoCardCalc('RemoteAO_Points' + n)
                        } else {
                            numCalc(this.series + 'RemoteAO_Points' + n, { m: this.series + 'RemoteAO_Module' + n, e: [this.series + 'RemoteAO_ETP' + n, this.series + 'RemoteAO_ETP1' + n] }, { m: this.series + 'RemoteAO_Module2' + n, e: [this.series + 'RemoteAO_ETP2' + n] })
                        }
                        numCalc(this.series + 'RemotePI_Points' + n, { m: this.series + 'RemotePI_Module' + n, e: [this.series + 'RemotePI_ETP' + n] })
                    })
                }
            } else if (p == 'DIPoints' || p.indexOf('DI_Points') != -1) {
                numCalc(p, { m: this.series + s + 'DI_Module' + l, e: [this.series + s + 'DI_ETP' + l, this.series + s + 'DI_ETP1' + l] }, { m: this.series + s + 'DI_Module2' + l, e: [this.series + s + 'DI_ETP2' + l] });
            } else if (p == this.series + s + 'DOPoints' || p.indexOf('DO_Points') != -1) {
                numCalc(p, { m: this.series + s + 'DO_Module' + l, e: [this.series + s + 'DO_ETP' + l, this.series + s + 'DO_ETP1' + l] }, { m: this.series + s + 'DO_Module2' + l, e: [this.series + s + 'DO_ETP2' + l] })
            } else if (p == 'AIPoints' || p.indexOf('AI_Points') != -1) {
                numCalc(p, { m: this.series + s + 'AI_Module' + l, e: [this.series + s + 'AI_ETP' + l, this.series + s + 'AI_ETP1' + l] }, { m: this.series + s + 'AI_Module2' + l, e: [this.series + s + 'AI_ETP2' + l] }, this.series + s + 'hasTCValue' + l)
            } else if (p == 'AI_TcPoints' || p.indexOf('RemoteAI_TC_Points') != -1 || p.indexOf('AI_TcPoints') != -1) {
                numCalc(p, { m: this.series + s + 'AI_Module2' + l, e: [this.series + s + 'AI_ETP2' + l] })
            } else if (p == 'AOPoints' || p == 'bigAOPoints' || (p.indexOf('RemoteAO_Points') != -1 && this.series == '') || p.indexOf('RemotebigAO_Points') != -1) { //Tricon
                aoCardCalc(p)
            } else if (this.series != '' && (p.indexOf('AOPoints') != -1 || p.indexOf('AO_Points') != -1)) {
                numCalc(p, { m: this.series + s + 'AO_Module' + l, e: [this.series + s + 'AO_ETP' + l, this.series + s + 'AO_ETP1' + l] }, { m: this.series + s + 'AO_Module2' + l, e: [this.series + s + 'AO_ETP2' + l] })
            } else if (p == 'PIPoints' || (this.series == '' && p.indexOf('RemotePI_Points') != -1)) {  //Tricon
                numCalc(p, { m: s + 'PI_Module' + l, e: [s + 'PI_ETP' + l] })
            } else if (p == 'TSx_PI_Points' || (this.series == 'TSx_' && p.indexOf('RemotePI_Points') != -1)) {  //TSxplus
                if (getItemValue('TSx_' + s + 'OSP_Enable' + l) == true && getItemValue('TSx_' + s + 'OSP_Group' + l) != 0) {
                    ospCalc(p, val)
                } else {
                    numCalc(p, {
                        m: this.series + s + 'PI_Module' + l,
                        e: [this.series + s + 'PI_ETP' + l]
                    }, { m: this.series + s + 'PI_Module2' + l, e: [this.series + s + 'PI_ETP2' + l] })
                }

            } else if (p == 'CX_PI_Points' || (this.series == 'CX_' && p.indexOf('RemotePI_Points') != -1)) {  //TriconCX
                numCalc(p, { m: this.series + s + 'PI_Module' + l, e: [this.series + s + 'PI_ETP' + l] })
            } else if (p == 'TSx_' + s + 'VM_Points' + l || p == 'TSx_' + s + 'VM_PointBuff' + l) {
                numCalc('TSx_' + s + 'VM_Points' + l, { m: 'TSx_' + s + 'VM_Module' + l, e: ['TSx_' + s + 'VM_ETP' + l] })
            } else if (p == 'TSx_' + s + 'SM_Points' + l || p == 'TSx_' + s + 'SM_PointBuff' + l) {
                numCalc('TSx_' + s + 'SM_Points' + l, { m: 'TSx_' + s + 'SM_Module' + l, e: ['TSx_' + s + 'SM_ETP' + l] })
            } else if (p.indexOf('UIO_Points') != -1 || p.indexOf('UIO_DO_Points') != -1) {  //CX的UIO
                numCalc(this.series + s + 'UIO_Points' + l, { m: this.series + s + 'UIO_Module' + l, e: [this.series + s + 'UIO_ETP' + l, this.series + s + 'UIO_ETP1' + l] }, { m: this.series + s + 'UIO_Module2' + l, e: [this.series + s + 'UIO_ETP2' + l] })
            } else if (p.indexOf('OSP_Group') != -1) {
                setItemQuantity('TSx_' + s + 'OSP_ETP' + l, val)
                ospCalc(p, val)
                local_calc()
            }
            if (p.indexOf('DI_MduleADD') != -1 || p.indexOf('DI_ModuleADD') != -1) {
                if (p.indexOf('Remote') != -1) {
                    DIPointsStr = this.series + s + 'DI_Points' + l
                }
                addOther(p, this.series + s + 'DI_Module' + l, this.series + s + 'DI_Module2' + l, DIPointsStr)
                module2NumChange(this.series + s + 'DI_Module2' + l, this.series + s + 'DI_ETP2' + l, { m: this.series + s + 'DI_Module' + l, e: [this.series + s + 'DI_ETP' + l, this.series + s + 'DI_ETP1' + l] }, DIPointsStr)
            } else if (p.indexOf('AI_ModuleADD') != -1) {
                if (p.indexOf('Remote') != -1) {
                    AIPointsStr = this.series + s + 'AI_Points' + l
                }
                if (getItemValue(this.series + s + 'hasTCValue' + l) == true) {
                    addOther(p, this.series + s + 'AI_Module' + l, AIPointsStr)
                    numCalc(AIPointsStr, { m: this.series + s + 'AI_Module' + l, e: [this.series + s + 'AI_ETP' + l, this.series + s + 'AI_ETP1' + l] }, this.series + s + 'hasTCValue' + l)
                } else {
                    addOther(p, this.series + s + 'AI_Module' + l, this.series + s + 'AI_Module2' + l, AIPointsStr)
                    module2NumChange(this.series + s + 'AI_Module2' + l, this.series + s + 'AI_ETP2' + l, { m: this.series + s + 'AI_Module' + l, e: [this.series + s + 'AI_ETP' + l, this.series + s + 'AI_ETP1' + l] }, AIPointsStr)
                }
            } else if (p.indexOf('Ex_ChassisADD') != -1) {
                if (p.indexOf('Remote') != -1) {
                    chassis_all_calc()
                } else {
                    local_calc()
                }
            } else if (p.indexOf('PI_ModuleADD') != -1) {
                if (getItemValue('TSx_' + s + 'OSP_Enable' + l) == true && getItemValue('TSx_' + s + 'OSP_Group' + l) != 0) {
                    ospCalc(p, val)
                } else {
                    if (p.indexOf('Remote') != -1) {
                        PIPointsStr = this.series + s + 'PI_Points' + l
                    }
                    addOther(p, this.series + s + 'PI_Module' + l, this.series + s + 'PI_Module2' + l, PIPointsStr)
                    module2NumChange(this.series + s + 'PI_Module2' + l, this.series + s + 'PI_ETP2' + l, { m: this.series + s + 'PI_Module' + l, e: [this.series + s + 'PI_ETP' + l, this.series + s + 'PI_ETP2' + l] }, PIPointsStr)
                }
            }
            if (p.indexOf('TC_Barrier_Points') != -1) {
                barrier_calc(p, this.series + s + 'TC_terminal' + l)
            }
            if (p == 'pointBuff') {
                chassis_all_calc()
            }
            setTimeout(() => {
                Ex_Chassis_Quantity_All_Calc()  //总数保护
            }, 700)
        },
        selectChange(p) {   //下拉框变化

            if (this.enableAutoCalc == 'false') {
                return false;
            }
            let s = ''  //是否远程
            let l = ''
            let n = 0
            let series = ''   //配置类型  ‘TSx_.....'
            let reg = /^TSx_.*/g
            let regCx = /^CX_.*/g
            if (reg.test(p)) {
                series = 'TSx_'
            } else if (regCx.test(p)) {
                series = 'CX_'
            }
            let DIPointsStr = 'DIPoints'
            let DOPointsStr = 'DOPoints'
            let AIPointsStr = 'AIPoints'
            let AOPointsStr = 'AOPoints'
            let PIPointsStr = 'PIPoints'
            if (series != '') {
                DIPointsStr = series + 'DI_Points'
                if (series == 'CX_') {
                    DOPointsStr = series + 'DOPoints'    //物料英文名称需修改
                    AOPointsStr = series + 'AO_Points'    //物料英文名称需修改
                } else {
                    DOPointsStr = series + 'DO_Points'   //物料英文名称需修改
                    AOPointsStr = series + 'AOPoints'    //物料英文名称需修改
                }
                AIPointsStr = series + 'AI_Points'
                PIPointsStr = series + 'PI_Points'
            }
            if (p.indexOf('Remote') != -1) {
                s = 'Remote'
                if (p.indexOf('#') != -1 && isNumber(p.substring(p.length - 1))) {
                    n = Number(p.substring(p.length - 1))
                    l = p.substring(p.length - 2)   //#1...2..3..
                }
                DIPointsStr = series + s + 'DI_Points' + l
                DOPointsStr = series + s + 'DO_Points' + l
                AIPointsStr = series + s + 'AI_Points' + l
                AOPointsStr = series + s + 'AO_Points' + l
                PIPointsStr = series + s + 'PI_Points' + l
            }

            if (p == series + s + 'DI_Module' + l) {
                numCalc(DIPointsStr, { m: series + s + 'DI_Module' + l, e: [series + s + 'DI_ETP' + l, series + s + 'DI_ETP1' + l] }, { m: series + s + 'DI_Module2' + l, e: [series + s + 'DI_ETP2' + l] })
            } else if (p == series + s + 'DI_ETP' + l) {
                etpSelectChange(series + s + 'DI_Module' + l, series + s + 'DI_ETP' + l, series + s + 'DI_ETP1' + l)
            } else if (p == series + s + 'DI_Module2' + l) {
                setItemQuantity(series + s + 'DI_Module2' + l, 0)
                module2NumChange(series + s + 'DI_Module2' + l, series + s + 'DI_ETP2' + l, { m: series + s + 'DI_Module' + l, e: [series + s + 'DI_ETP' + l, series + s + 'DI_ETP1' + l] }, DIPointsStr)
            } else if (p == series + s + 'DI_ETP1' + l) {
                //  setItemQuantity(series+s+'DI_ETP1'+l,0)
                module1Etp1Change(p, series + s + 'DI_Module' + l, series + s + 'DI_ETP' + l, DIPointsStr)
            } else if (p == series + s + 'DI_ETP2' + l) {
                etpSelectChange(series + s + 'DI_Module2' + l, series + s + 'DI_ETP2' + l)
            }
            if (p == series + s + 'DO_Module' + l) {
                numCalc(DOPointsStr, { m: series + s + 'DO_Module' + l, e: [series + s + 'DO_ETP' + l, series + s + 'DO_ETP1' + l] }, { m: series + s + 'DO_Module2' + l, e: [series + s + 'DO_ETP2' + l] })
            } else if (p == series + s + 'DO_ETP' + l) {
                etpSelectChange(series + s + 'DO_Module' + l, series + s + 'DO_ETP' + l, series + s + 'DO_ETP1' + l)
            } else if (p == series + s + 'DO_Module2' + l) {
                setItemQuantity(series + s + 'DO_Module2' + l, 0)
                module2NumChange(series + s + 'DO_Module2' + l, series + s + 'DO_ETP2' + l, { m: series + s + 'DO_Module' + l, e: [series + s + 'DO_ETP' + l, series + s + 'DO_ETP1' + l] }, DOPointsStr)
            } else if (p == series + s + 'DO_ETP1' + l) {
                setItemQuantity(series + s + 'DO_ETP1' + l, 0)
                module1Etp1Change(p, series + s + 'DO_Module' + l, series + s + 'DO_ETP' + l, DOPointsStr)
            } else if (p == series + s + 'DO_ETP2' + l) {
                etpSelectChange(series + s + 'DO_Module2' + l, series + s + 'DO_ETP2' + l)
            }
            if (p == series + s + 'AI_Module' + l) {
                numCalc(AIPointsStr, { m: series + s + 'AI_Module' + l, e: [series + s + 'AI_ETP' + l, series + s + 'AI_ETP1' + l] }, { m: series + s + 'AI_Module2' + l, e: [series + s + 'AI_ETP2' + l] }, series + s + 'hasTCValue' + l)
            } else if (p == series + s + 'AI_ETP' + l) {
                etpSelectChange(series + s + 'AI_Module' + l, series + s + 'AI_ETP' + l, series + s + 'AI_ETP1' + l)
            } else if (p == series + s + 'AI_Module2' + l) {
                aiEtpSelectChange(p)
            } else if (p == series + s + 'AI_ETP1' + l) {
                setItemQuantity(series + s + 'AI_ETP1' + l, 0)
                module1Etp1Change(p, series + s + 'AI_Module' + l, series + s + 'AI_ETP' + l, AIPointsStr)
            } else if (p == series + s + 'AI_ETP2' + l) {
                etpSelectChange(series + s + 'AI_Module2' + l, series + s + 'AI_ETP2' + l)
            }
            if (p == s + 'AO_Module' + l || p == s + 'AO_Module2' + l || p == s + 'AO_ETP' + l || p == s + 'AO_ETP1' + l || p == s + 'AO_ETP2' + l || p == s + 'AOUseSameCard' + l) {
                aoCardCalc(p)
            }
            if (series != '') {  //TSXplus的AO
                if (p == series + s + 'AO_Module' + l) {
                    numCalc(DIPointsStr, { m: series + s + 'AO_Module' + l, e: [series + s + 'AO_ETP' + l, series + s + 'AO_ETP1' + l] }, { m: series + s + 'AO_Module2' + l, e: [series + s + 'AO_ETP2' + l] })
                } else if (p == series + s + 'AO_ETP' + l) {
                    etpSelectChange(series + s + 'AO_Module' + l, series + s + 'AO_ETP' + l, series + s + 'AO_ETP1' + l)
                } else if (p == series + s + 'AO_Module2' + l) {
                    setItemQuantity(series + s + 'AO_Module2' + l, 0)
                    module2NumChange(series + s + 'AO_Module2' + l, series + s + 'AO_ETP2' + l, { m: series + s + 'AO_Module' + l, e: [series + s + 'AO_ETP' + l, series + s + 'AO_ETP1' + l] }, DIPointsStr)
                } else if (p == series + s + 'AO_ETP1' + l) {
                    setItemQuantity(series + s + 'AO_ETP1' + l, 0)
                    module1Etp1Change(p, series + s + 'AO_Module' + l, series + s + 'AO_ETP' + l, DIPointsStr)
                } else if (p == series + s + 'AO_ETP2' + l) {
                    etpSelectChange(series + s + 'AO_Module2' + l, series + s + 'AO_ETP2' + l)
                }
            }

            if (p == 'TSx_' + s + 'VM_Module' + l) {
                numCalc('TSx_' + s + 'VM_Points' + l, { m: 'TSx_' + s + 'VM_Module' + l, e: ['TSx_' + s + 'VM_ETP' + l] })
            } else if (p == 'TSx_' + s + 'VM_ETP' + l) {
                etpSelectChange('TSx_' + s + 'VM_Module' + l, 'TSx_' + s + 'VM_ETP' + l)
            } else if (p == 'TSx_' + s + 'SM_Module' + l) {
                numCalc('TSx_' + s + 'SM_Points' + l, { m: 'TSx_' + s + 'SM_Module' + l, e: ['TSx_' + s + 'SM_ETP' + l] })
            } else if (p == 'TSx_' + s + 'SM_ETP' + l) {
                etpSelectChange('TSx_' + s + 'SM_Module' + l, 'TSx_' + s + 'SM_ETP' + l)
            }
            if (p == series + s + 'UIO_Module' + l) {
                numCalc(series + s + 'UIO_Points' + l, { m: series + s + 'UIO_Module' + l, e: [series + s + 'UIO_ETP' + l, series + s + 'UIO_ETP1' + l] }, { m: series + s + 'UIO_Module2' + l, e: [series + s + 'UIO_ETP2' + l] })
            } else if (p == series + s + 'UIO_ETP' + l) {
                etpSelectChange(series + s + 'UIO_Module' + l, series + s + 'UIO_ETP' + l, series + s + 'UIO_ETP1' + l)
            } else if (p == series + s + 'UIO_Module2' + l) {
                setItemQuantity(series + s + 'UIO_Module2' + l, 0)
                module2NumChange(series + s + 'UIO_Module2' + l, series + s + 'UIO_ETP2' + l, { m: series + s + 'UIO_Module' + l, e: [series + s + 'UIO_ETP' + l, series + s + 'UIO_ETP1' + l] }, series + s + 'UIO_Points' + l)
            } else if (p == series + s + 'UIO_ETP1' + l) {
                setItemQuantity(series + s + 'UIO_ETP1' + l, 0)
                module1Etp1Change(p, series + s + 'UIO_Module' + l, series + s + 'UIO_ETP' + l, series + s + 'UIO_Points' + l)
            } else if (p == series + s + 'UIO_ETP2' + l) {
                etpSelectChange(series + s + 'UIO_Module2' + l, series + s + 'UIO_ETP2' + l)
            }
            if (p == series + s + 'PI_Module' + l) {
                numCalc(PIPointsStr, { m: series + s + 'PI_Module' + l, e: [series + s + 'PI_ETP' + l] })
            } else if (p == series + s + 'PI_ETP' + l) {
                etpSelectChange(series + s + 'PI_Module' + l, series + s + 'PI_ETP' + l)
            } else if (p == series + s + 'PI_ETP2' + l) {
                etpSelectChange(series + s + 'PI_Module2' + l, series + s + 'PI_ETP2' + l)
            }
            if (p.indexOf('TC_terminal') != -1) {
                barrier_calc(this.series + s + 'TC_Barrier_Points' + l, this.series + s + 'TC_terminal' + l)
            }
            if (p == 'CX_PS_Module') {
                local_calc()
            } else if (p.indexOf('CX_RemotePS_Module') != -1) {
                chassis_calc(n)
            }
            setTimeout(() => {
                Ex_Chassis_Quantity_All_Calc()  //总数保护
            }, 700)
        },
        numLimit(e) {
            let key = e.key
            if (key === 'e' || key === '.') {
                e.returnValue = false
                return false
            }
            return true
        },
        selectNumChange(p, val) {
            let series = ''
            let reg = /^TSx_.*/g
            let regCx = /^CX_.*/g
            if (reg.test(p)) {
                series = 'TSx_'
            } else if (regCx.test(p)) {
                series = 'CX_'
            }
            if (this.enableAutoCalc == 'false') {
                return false;
            }
            //下拉框后的输入框
            //卡2的件数修改时 ，重置ETP2，同时平衡卡1的件数，卡1件数的修改会重置ETP，清空ETP1
            let s = ''
            let l = ''
            let n = undefined
            //配置类型  ‘TSx_.....'

            let DIPointsStr = 'DIPoints'
            let DOPointsStr = 'DOPoints'
            let AIPointsStr = 'AIPoints'
            let AOPointsStr = 'AOPoints'
            let PIPointsStr = 'PIPoints'
            if (series != '') {
                DIPointsStr = series + 'DI_Points'
                if (series == 'CX_') {
                    DOPointsStr = series + 'DOPoints'    //物料英文名称需修改
                    AOPointsStr = series + 'AO_Points'    //物料英文名称需修改
                } else {
                    DOPointsStr = series + 'DO_Points'   //物料英文名称需修改
                    AOPointsStr = series + 'AOPoints'    //物料英文名称需修改
                }
                AIPointsStr = series + 'AI_Points'
                PIPointsStr = series + 'PI_Points'
            }
            if (p.indexOf('Remote') != -1) {
                s = 'Remote'
                if (p.indexOf('#') != -1 && isNumber(p.substring(p.length - 1))) {
                    n = Number(p.substring(p.length - 1))
                    l = p.substring(p.length - 2)   //#1...2..3..
                } else {
                    n = 0
                }
                DIPointsStr = series + s + 'DI_Points' + l
                DOPointsStr = series + s + 'DO_Points' + l
                AIPointsStr = series + s + 'AI_Points' + l
                AOPointsStr = series + s + 'AO_Points' + l
                PIPointsStr = series + s + 'PI_Points' + l
            }

            if (p == series + s + 'DI_Module2' + l) {
                module2NumChange(p, series + s + 'DI_ETP2' + l, { m: series + s + 'DI_Module' + l, e: [series + s + 'DI_ETP' + l, series + s + 'DI_ETP1' + l] }, DIPointsStr)
            } else if (p == series + s + 'DO_Module2' + l) {
                module2NumChange(p, series + s + 'DO_ETP2' + l, { m: series + s + 'DO_Module' + l, e: [series + s + 'DO_ETP' + l, series + s + 'DO_ETP1' + l] }, DOPointsStr)
            } else if (p == series + s + 'AI_Module2' + l) {
                module2NumChange(p, series + s + 'AI_ETP2' + l, { m: series + s + 'AI_Module' + l, e: [series + s + 'AI_ETP' + l, series + s + 'AI_ETP1' + l] }, AIPointsStr)
            } else if (p == series + s + 'AO_Module2' + l) {
                module2NumChange(p, series + s + 'AO_ETP2' + l, { m: series + s + 'AO_Module' + l, e: [series + s + 'AO_ETP' + l, series + s + 'AO_ETP1' + l] }, AOPointsStr)
            } else if (series == 'TSx_' && p == series + s + 'PI_Module2' + l) { //TSxplus
                // if(getItemValue('TSx_'+s+'OSP_Enable'+l)==true && getItemValue('TSx_'+s+'OSP_Group'+l)!=0){
                if (getItemValue('TSx_' + s + 'OSP_Enable' + l) == true) {
                    TSxModule2num(p, val)
                } else {
                    module2NumChange(p, series + s + 'PI_ETP2' + l, { m: series + s + 'PI_Module' + l, e: [series + s + 'PI_ETP' + l] }, PIPointsStr)
                }
            } else if (series == 'CX_' && p == series + s + 'UIO_Module2' + l) {  //CX
                module2NumChange(p, series + s + 'UIO_ETP2' + l, { m: series + s + 'UIO_Module' + l, e: [series + s + 'UIO_ETP' + l, series + s + 'UIO_ETP1' + l] }, series + s + 'UIO_Points' + l)
            }
            else if (p == s + 'CM_Module_Spec' + l) {
                //通讯卡数量变化
                //  Ex_Chassis_Quantity_Calc();
                local_calc()
            }
            //卡1的 第二个端子板修改时，平衡 卡1的第一个端子板
            if (p == series + s + 'DI_ETP1' + l) {
                module1Etp1Change(p, series + s + 'DI_Module' + l, series + s + 'DI_ETP' + l, DIPointsStr)
            } else if (p == series + s + 'DO_ETP1' + l) {
                module1Etp1Change(p, series + s + 'DO_Module' + l, series + s + 'DO_ETP' + l, DOPointsStr)
            } else if (p == series + s + 'AI_ETP1' + l) {
                module1Etp1Change(p, series + s + 'AI_Module' + l, series + s + 'AI_ETP' + l, AIPointsStr)
            } else if (p == series + s + 'AO_ETP1' + l) {
                module1Etp1Change(p, series + s + 'AO_Module' + l, series + s + 'AO_ETP' + l, AOPointsStr)
            } else if (p == series + s + 'UIO_ETP1' + l) {
                module1Etp1Change(p, series + s + 'UIO_Module' + l, series + s + 'UIO_ETP' + l, series + s + 'UIO_Points' + l)
            }
            if (p == s + 'DI_Module2' + l || p == s + 'DO_Module2' + l || p == s + 'AI_Module2' + l || p == s + 'AO_Module2' + l || p == s + 'CM_Module_Spec' + l) {
                setTimeout(() => {
                    Ex_Chassis_Quantity_All_Calc()  //总数保护
                }, 700)
            }
            if (p == this.series + '1131') {
                if (val < 1) {
                    val = 1
                    setItemQuantity(p, val)
                }
            }
            //机架空槽板
            if (p == 'TSx_CPU' || p == this.series + 'CM_Module_Spec' || p == this.series + 'CM_Module') {
                BlankSlotPanel_calc(p, val)
            }
            //系统电缆2
            if (p == this.series + s + 'ELCO_Cable2' + l || p == this.series + s + 'IO_Cable2' + l) {
                elco2_calc(val, n)
            }
            if (p == this.series + s + 'IOBus_FJumper2' + l) {
                FjumperCalc(p, val)
            }
        },
        switchChange(p, val) {   //开关
            let l = ''
            let n = 0
            let s = ''
            let DIPointsStr = 'DIPoints'
            let AIPointsStr = 'AIPoints'
            let PIPointsStr = 'PIPoints'
            if (this.series != '') {
                DIPointsStr = this.series + 'DI_Points'
                AIPointsStr = this.series + 'AI_Points'
                PIPointsStr = this.series + 'PI_Points'
            }
            if (p.indexOf('Remote') != -1) {
                s = 'Remote'
                if (p.indexOf('#') != -1 && isNumber(p.substring(p.length - 1))) {
                    n = Number(p.substring(p.length - 1))
                    l = p.substring(p.length - 2)   //#1...2..3..
                }
                DIPointsStr = this.series + s + 'DI_Points' + l
                AIPointsStr = this.series + s + 'AI_Points' + l
                PIPointsStr = this.series + s + 'PI_Points' + l
            }

            if (p.indexOf('hasTCValue') != -1) {
                this.tcs[this.series + s + 'AI_Module2' + l + 'hasTcValue'] = val
                if (s == '') {
                    clearNum(vue.$data.series + s + 'AI_TcPoints' + l)
                } else {
                    clearNum(vue.$data.series + s + 'AI_TC_Points' + l)
                }
                if (val == false) {
                    setItemValue(this.series + s + 'AI_Module2' + l, this.oldAiCode)
                    aiSwitchChange(p, val)
                    // let key=vue.$data.itemApiKeys[this.series+s+"AI_Module2"+l];
                    // let itemId=key.split("::")[2];
                    // let urlMap=getRefrenceItemsInUrlMap({"id":itemId},this.oldAiCode);
                    // refrenceItemChange(urlMap).then(function(res){
                    //     if(res==true){
                    //         aiSwitchChange(p,val)
                    //     }
                    // })
                } else {
                    if (getItemValue(this.series + s + 'AI_Module2' + l) != this.AICardCode) {
                        this.oldAiCode = getItemValue(this.series + s + 'AI_Module2' + l)
                    }
                    aiSwitchChange(p, val)
                }

            }
            // if(this.enableAutoCalc=='false'){
            //     return false
            // }
            if (p.indexOf('hasBigDoValue') != -1) {
                clearNum(this.series + 'bigDoPoints', this.series + 'bigDoValue')
            } else if (p.indexOf('hasBigAO') != -1) {
                aoSwitchChange(p, val)
            } else if (p.indexOf('RemotehasBigDOValue') != -1) {
                clearNum(this.series + 'RemotebigDO_Points' + l, this.series + 'RemotebigDOValue' + l)
            } else if (p.indexOf('ADD_Enable') != -1) {
                if (!getItemValue(p)) {
                    clearNum(this.series + s + 'Ex_ChassisADD' + l, this.series + s + 'DI_ModuleADD' + l, this.series + s + 'AI_ModuleADD' + l)
                    if (this.series == 'TSx_') {
                        clearNum(this.series + s + 'PI_ModuleADD' + l)
                    }
                    if (this.enableAutoCalc == 'false') {
                        return false;
                    }
                    numCalc(DIPointsStr, { m: this.series + s + 'DI_Module' + l, e: [this.series + s + 'DI_ETP' + l, this.series + s + 'DI_ETP1' + l] }, { m: this.series + s + 'DI_Module2' + l, e: [this.series + s + 'DI_ETP2' + l] })
                    numCalc(AIPointsStr, { m: this.series + s + 'AI_Module' + l, e: [this.series + s + 'AI_ETP' + l, this.series + s + 'AI_ETP1' + l] }, { m: this.series + s + 'AI_Module2' + l, e: [this.series + s + 'AI_ETP2' + l] }, this.series + s + 'hasTCValue' + l)
                    if (this.series == 'TSx_') {
                        if (getItemValue('TSx_' + s + 'OSP_Enable' + l) == true && getItemValue('TSx_' + s + 'OSP_Group' + l) != 0) {
                            ospCalc(PIPointsStr, val)
                        } else {
                            numCalc(PIPointsStr, {
                                m: this.series + s + 'PI_Module' + l,
                                e: [this.series + s + 'PI_ETP' + l]
                            }, { m: this.series + s + 'PI_Module2' + l, e: [this.series + s + 'PI_ETP2' + l] })
                        }
                    }
                }
            } else if (p.indexOf('OSP_Enable') != -1) {
                clearNum('TSx_' + s + 'OSP_Group' + l)
                setItemQuantity('TSx_' + s + 'OSP_ETP' + l, 0)
                if (this.enableAutoCalc == 'false') {
                    return false
                }
                numCalc(PIPointsStr, {
                    m: this.series + s + 'PI_Module' + l,
                    e: [this.series + s + 'PI_ETP' + l]
                }, { m: this.series + s + 'PI_Module2' + l, e: [this.series + s + 'PI_ETP2' + l] })
            } else if (p == 'TSx_RemoteConnect') {
                if (this.enableAutoCalc == 'false') {
                    return false
                }
                local_calc()
            }

            if (p.indexOf('hasRelay_SIL') != -1) {
                setItemQuantity(this.series + s + 'Relay_SIL' + l, 0)
            } else if (p.indexOf('hasHighVoltagemotor') != -1) {
                setItemQuantity(this.series + s + 'Relay2' + l, 0)
                setItemQuantity(this.series + s + 'Relay_Socket2' + l, 0)
            }
        },
        handleBlur(cur, old, id, name) {
            if (this.spareFlags && this.spareFlags.length) {
                if (this.spareFlags.indexOf(name + '_' + id) != -1) {
                    if (cur > 0) {
                        let a = this.spareFlags.indexOf(name + '_' + id)
                        this.spareFlags.splice(a, 1)
                    }
                }
            }
        },
        handleChange(value, direction, movedKeys, i, blockId) {
            this.spareFlags = []
            if (direction == 'right') {
                let changeFlag = true
                movedKeys.forEach((item, index) => {
                    if (this.sparesQuantity[i.name + '_' + item] == undefined || !this.sparesQuantity[i.name + '_' + item]) {
                        changeFlag = false
                        this.spareFlags.push(i.name + '_' + item)
                        let a = 0
                        a = this.itemValues['itemValue::' + blockId + '::' + i.id].indexOf(item)
                        this.itemValues['itemValue::' + blockId + '::' + i.id].splice(a, 1)
                    }
                })
                if (!changeFlag) {
                    this.$message.warning('有勾选项未填写数量 或 数量为0')
                }
            }
        },
        discountPriceChange(val, row) {
            if (row.discountable__c == 'false' || row.discountable__c == 0) {
                row.discountPrice__c = val
            }
            let c = row.listPrice__c - row.discountPrice__c
            let a = 0
            if (row.listPrice__c != 0) {
                a = c / row.listPrice__c
            }
            row.discount__c = (a * 100).toFixed(2) + '%'
            averageInputDiscount(row, row.discountCategory__c, this.steps)
        },
        priceChange(val, row) {
            if (row.itemValue__c == '15-99-03-00-00-04') {
                return false
            }
            this.steps.forEach(item => {
                if (item.groups && item.groups.length) {
                    item.groups.forEach(item2 => {
                        if (item2.children && item2.children.length) {
                            item2.children.forEach(item3 => {
                                if (item3.itemValue__c == row.itemValue__c) {
                                    item3.price__c = val
                                }
                            })
                        }
                    })
                }
            })
        },
        configSave(val) {
            document.body.removeEventListener('beforeunload', checkLeave)
            setTimeout(function (res) {
                saveConfig(val);
            }, 1)
        },
        saveDiscount() {
            this.$confirm('注意：该操作将同步生成报价及合同下的产品信息, 是否继续?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                let all = vue.$data.steps
                let zeroFlag = false
                if (all && all.length > 0) {
                    for (i = 0; i < all.length; i++) {
                        let groups = all[i].groups;
                        for (j = 0; j < groups.length; j++) {
                            let items = groups[j]['children'];
                            for (k = 0; k < items.length; k++) {
                                if (items[k].listPrice__c == 0) {
                                    zeroFlag = true
                                }
                            }
                        }
                    }
                }
                if (zeroFlag && (this.duanpei == this.duanpeiUserId)) {
                    this.$confirm('有表价值为0的数据，是否继续保存?', '提示', {
                        confirmButtonText: '确定',
                        cancelButtonText: '取消',
                        type: 'warning'
                    }).then(function () {
                        saveDiscountInfo()
                    }).catch(function () {
                        this.$message.success('已取消操作')
                    })
                } else {
                    saveDiscountInfo();
                }

            }).catch(() => {

            });

        }
    }
});