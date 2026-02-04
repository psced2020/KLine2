# -*- coding: utf-8 -*-
import baostock as bs
import json
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# 登录 Baostock
def ensure_login():
    lg = bs.login()
    if lg.error_code != '0':
        print(f"登录失败: {lg.error_msg}")
        return None
    return lg

@app.route('/api/stock', methods=['GET'])
def get_stock_data():
    code = request.args.get('code', 'sh.600519')
    start_date = request.args.get('start_date', '2020-01-01')
    end_date = request.args.get('end_date', '2026-01-31')
    adjustflag = request.args.get('adjustflag', '2')  # 2=前复权
    frequency = request.args.get('frequency', 'd')  # d=日K, w=周K, m=月K

    # 确保登录
    ensure_login()

    # 获取K线数据
    rs = bs.query_history_k_data_plus(
        code,
        "date,code,open,high,low,close,volume,amount",
        start_date=start_date,
        end_date=end_date,
        frequency=frequency,
        adjustflag=adjustflag
    )

    data_list = []
    while (rs.error_code == '0') & rs.next():
        data_list.append(rs.get_row_data())

    # 转换为前端需要的格式
    result = []
    for row in data_list:
        result.append({
            'date': row[0],
            'open': float(row[2]) if row[2] else 0,
            'high': float(row[3]) if row[3] else 0,
            'low': float(row[4]) if row[4] else 0,
            'close': float(row[5]) if row[5] else 0,
            'volume': int(row[6]) if row[6] else 0,
            'amount': float(row[7]) if row[7] else 0
        })

    # 不反转数据，保持从早到晚的顺序
    # result.reverse()

    return jsonify({
        'data': result,
        'fields': ['date', 'open', 'high', 'low', 'close', 'volume', 'amount']
    })

@app.route('/api/stock/name', methods=['GET'])
def get_stock_name():
    code = request.args.get('code', 'sh.600519')

    # 确保登录
    ensure_login()

    # 获取股票基本信息 - 使用简化的方式获取名称
    rs = bs.query_stock_basic(code=code)

    if rs.error_code != '0':
        print(f"获取股票信息错误: {rs.error_msg}")
        return jsonify({'name': ''})

    data_list = []
    while (rs.error_code == '0') & rs.next():
        data_list.append(rs.get_row_data())

    print(f"获取到的股票信息: {data_list}")

    if data_list and len(data_list[0]) > 4:
        # stock_basic返回的字段: code, code_name, ipoDate, outDate, type, status
        name = data_list[0][1]  # code_name 是股票名称
        return jsonify({'name': name})
    else:
        return jsonify({'name': ''})

if __name__ == '__main__':
    print("正在启动 Baostock 数据服务...")
    print("API地址: http://localhost:5000/api/stock")
    print("示例: http://localhost:5000/api/stock?code=sh.600519&start_date=2020-01-01&end_date=2026-01-31")
    app.run(host='0.0.0.0', port=5000, debug=True)
