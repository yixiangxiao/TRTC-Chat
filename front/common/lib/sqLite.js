export default {
	dbName:'chat',
	dbPath:"_doc/chat.db",
	pageSize: 100,
	//打开数据库，在使用数据库前，必须打开数据库
	openSqlite() {
		return new Promise((resolve, reject) => {
			plus.sqlite.openDatabase({
				name: this.dbName, //这里是数据库的名称
				path: this.dbPath, //_doc是相对路径的应用私有文档目录
				success: function(e) {
					console.log('数据库打开成功')
					resolve(e)
				},
				fail: function(e) {
					console.log('数据库打开失败:' + JSON.stringify(e))
					reject(e)
				}
			})
		})
	},
	//判断是否打开数据库
	isOpen() {
		return plus.sqlite.isOpenDatabase({
			name: this.dbName,
			path: this.dbPath
		})
	},

	//关闭数据库
	closeDb() {
		return new Promise((resolve, reject) => {
			plus.sqlite.closeDatabase()({
				name: this.dbName, //这里是数据库的名称
				success: function(e) {
					console.log('数据库关闭成功')
					resolve(e)
				},
				fail: function(e) {
					console.log('数据库关闭失败')
					reject(e)
				}
			})
		})
	},

	//查询sql 所有的查询都用该方法
	selectSql(sqlText) {
		return new Promise((resolve, reject) => {
			plus.sqlite.selectSql({
				name: this.dbName, //这里是数据库的名称
				sql: sqlText,
				success: function(e) {
					console.log('查询成功:' + sqlText)
					resolve(e)
				},
				fail: function(e) {
					console.log('查询失败:' + sqlText + "-异常信息:" + JSON.stringify(e))
					reject(e)
				}
			})
		})
	},
	//执行增删改查都使用该方法
	executeSql(sqlText) {
		return new Promise((resolve, reject) => {
			plus.sqlite.executeSql({
				name: this.dbName, //这里是数据库的名称
				sql: sqlText,
				success: function(e) {
					console.log('操作成功')
					resolve(e)
				},
				fail: function(e) {
					console.log('执行失败:' + sqlText + '-异常信息:' + JSON.stringify(e))
					reject(e)
				}
			})
		})
	},
	
	// 数据库建表 sql:'CREATE TABLE IF NOT EXISTS dbTable("id" varchar(50),"name" TEXT)
	// 创建 CREATE TABLE IF NOT EXISTS 、 dbTable 是表名，不能用数字开头、括号里是表格的表头
	createTable(dbTable, data) {
	    return new Promise((resolve, reject) => {
	       // executeSql: 执行增删改等操作的SQL语句
	        plus.sqlite.executeSql({
	            name: this.dbName,
	            sql: `CREATE TABLE IF NOT EXISTS ${dbTable}(${data})`,
	            success(e) {
					resolve(e);
				},
				fail(e) {
					reject(e);
				}
			})
	    })
	},
	
	// 数据库删表 sql:'DROP TABLE dbTable'
	dropTable(dbTable) {
	    return new Promise((resolve, reject) => {
	       plus.sqlite.executeSql({
				name: this.dbName,
				sql: `DROP TABLE ${dbTable}`,
				success(e) {
				  resolve(e);
				},
				fail(e) {
				  reject(e);
				}
			})
	    })
	},
}