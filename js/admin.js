const orderList = document.querySelector('.orderList'); // 訂單列表 tbody DOM
let orderData = []; // 訂單資料陣列

/*** 初始化 ***/
function init(){
    getOrderList();
}
init();

// C3 圖表渲染
function renderC3(){
    // 蒐集資料
    let totalObj = {};
    orderData.forEach(function(item){
        item.products.forEach(function(productItem){
            if(totalObj[productItem.category] == undefined){
                totalObj[productItem.category] = productItem.price * productItem.quantity;
            }else{
                totalObj[productItem.category] += productItem.price * productItem.quantity;
            }
        })
    })

    // 整理資料
    let categoryAry = Object.keys(totalObj);
    let newData = [];
    categoryAry.forEach(function(item){
        let ary = [];
        ary.push(item);
        ary.push(totalObj[item]);
        newData.push(ary);
    })

    // 渲染
    let chart = c3.generate({
        bindto: '#chart', // HTML 元素綁定
        data: {
            type: "pie",
            columns: newData,
        },
    });
}

// C3 LV2 圖表渲染
function renderC3Lv2(){
    // 蒐集資料
    let totalObj = {};
    orderData.forEach(function(item){
        item.products.forEach(function(productItem){
            if(totalObj[productItem.title] == undefined){
                totalObj[productItem.title] = productItem.price * productItem.quantity;
            }else{
                totalObj[productItem.title] += productItem.price * productItem.quantity;
            }
        })
    })
    // console.log(totalObj);

    // 整理資料
    let productAry = Object.keys(totalObj);
    // console.log(productAry);
    let sortAry = []; // 要去比大小的陣列
    productAry.forEach(function(item){
        let ary = [];
        ary.push(item);
        ary.push(totalObj[item]);
        sortAry.push(ary);
    })
    console.log(sortAry);

    // 比大小：由大到小（sort: https://developer.mozilla.org/zh-TW/docs/Web/JavaScript/Reference/Global_Objects/Array/sort）
    sortAry.sort(function(a, b) {
        return b[1] - a[1];
    });
    console.log(sortAry);

    // 超過四筆時，將第四筆（含）以後整合為其他
    if(sortAry.length > 3){
        let otherTotal = 0;
        sortAry.forEach(function(item,index){
            // 第四筆 index=3 開始
            if(index >= 3){
                otherTotal += sortAry[index][1]; // 加總金額
            }
        })
        sortAry.splice(3,sortAry.length-1); // 從 index=3 開始移除資料
        sortAry.push(['其他', otherTotal]); // 將 "其他" push 到第四筆
    }

    // 渲染
    let chart = c3.generate({
        bindto: '#chart', // HTML 元素綁定
        data: {
            type: "pie",
            columns: sortAry,
        },
        color: {
            pattern: ["#DACBFF", "#9D7FEA", "#5434A7", "#301E5F"],
        }
    });
}

/*** 渲染訂單列表 ***/
// 取得訂單資料並渲染
function getOrderList(){
    axios.get(`https://hexschoollivejs.herokuapp.com/api/livejs/v1/admin/${api_path}/orders`,{
        headers:{
            'Authorization': token,
        }
    })
    .then(function(response){
        orderData = response.data.orders;
        let orderStr = ""; // 訂單字串
        
        orderData.forEach(function(item){
            // 組產品字串
            let productStr = ""; // 產品字串
            item.products.forEach(function(productItem){
                productStr += `<p>${productItem.title}x${productItem.quantity}</p>`;
            });

            // 判斷訂單處理狀態
            let orderStatus = "";
            if(item.paid == true){
                orderStatus = "已處理";
            }else{
                orderStatus = "未處理";
            }

            // 組時間字串
            const theTime = new Date(item.createdAt *1000);
            const orderTime = `${theTime.getFullYear()}/${theTime.getMonth()+1}/${theTime.getDate()}`
        
            // 組訂單字串
            orderStr += `<tr>
                <td>${item.id}</td>
                <td>
                    <p>${item.user.name}</p>
                    <p>${item.user.tel}</p>
                </td>
                <td>${item.user.address}</td>
                <td>${item.user.email}</td>
                <td>${productStr}</td>
                <td>${orderTime}</td>
                <td class="orderStatus">
                    <a href="#" class="js-orderStatus" data-status="${item.paid}" data-id="${item.id}">${orderStatus}</a>
                </td>
                <td>
                    <input type="button" class="delSingleOrder-Btn js-orderDelete" data-id="${item.id}" value="刪除">
                </td>
            </tr>`;
        });
        orderList.innerHTML = orderStr;
        renderC3Lv2();
    });
}

// 刪除單筆訂單資料與更改訂單狀態
orderList.addEventListener('click',function(e){
    e.preventDefault();
    const targetClass = e.target.getAttribute('class');
    let id = e.target.getAttribute('data-id');

    // 更改訂單狀態
    if(targetClass == "js-orderStatus"){
        let status = e.target.getAttribute('data-status');
        changeOrderStatus(status,id);
        return;
    }

    // 刪除單筆資料
    if(targetClass == "delSingleOrder-Btn js-orderDelete"){
        deleteOrderItem(id);
        return;
    }

})
// 更改訂單狀態函式
function changeOrderStatus(status,id){
    console.log(status);
    if(status == true){
        status = false;
    }else{
        status = true;
    }
    axios.put(`https://hexschoollivejs.herokuapp.com/api/livejs/v1/admin/${api_path}/orders`,{
        "data": {
            "id": id,
            "paid": status
        }
    },{
        headers:{
            'Authorization': token,
        }
    })
    .then(function(response){
        alert('訂單狀態修改成功！');
        getOrderList();
    });
}
// 刪除單筆資料函式
function deleteOrderItem(id){
    axios.delete(`https://hexschoollivejs.herokuapp.com/api/livejs/v1/admin/${api_path}/orders/${id}`,{
        headers:{
            'Authorization': token,
        }
    })
    .then(function(response){
        alert('刪除該筆訂單成功！');
        getOrderList();
    });
}

// 刪除全部訂單
const discardAllBtn = document.querySelector('.discardAllBtn');
discardAllBtn.addEventListener('click',function(e){
    e.preventDefault();
    axios.delete(`https://hexschoollivejs.herokuapp.com/api/livejs/v1/admin/${api_path}/orders`,{
        headers:{
            'Authorization': token,
        }
    })
    .then(function(response){
        alert('刪除全部訂單成功！');
        getOrderList();
    });
})