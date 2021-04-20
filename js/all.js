/*  小步測試>開發>小步測試>小步測試>開發>小小重構
    函式：消除重複
*/ 

const productList = document.querySelector('.productWrap'); // 產品列表 ul DOM
const productSelect = document.querySelector('.productSelect'); // 產品搜尋 select DOM
const cartList = document.querySelector('.shoppingCartList'); // 購物車列表 tbody DOM
let productData = []; // 產品資料陣列
let cartData = []; // 購物車資料陣列

// 初始化
function init(){
    getProductList();
    getCartList();
}
init();

/*** 渲染產品列表 ***/ 
// 組產品字串
function productHTMLCombine(item){
    return `<li class="productCard">
        <h4 class="productType">新品</h4>
        <img src="${item.images}"
            alt="">
        <a href="#" id="addCardBtn" class="js-addCart" data-id="${item.id}">加入購物車</a>
        <h3>${item.title}</h3>
        <del class="originPrice">NT$ ${toThousands(item.origin_price)}</del>
        <p class="nowPrice">NT$ ${toThousands(item.price)}</p>
    </li>`;
}
// 渲染產品列表的函式
function renderProductList(){
    let productStr = "";
    productData.forEach(function (item) {
        productStr += productHTMLCombine(item);
    })
    productList.innerHTML = productStr;
}
// 取得資料並渲染
function getProductList() {
    axios.get(`https://hexschoollivejs.herokuapp.com/api/livejs/v1/customer/${api_path}/products`)
    .then(function (response) {
        productData = response.data.products;
        renderProductList();
    });
}
// 篩選產品類別列表資料
productSelect.addEventListener('change',function(e){
    const category = e.target.value;
    if(category == "全部"){
        renderProductList();
        return;
    }
    let productStr = "";
    productData.forEach(function(item){
        if(item.category == category){
            productStr += productHTMLCombine(item);
        }
    });
    productList.innerHTML = productStr;
});

/*** 渲染購物車列表 ***/ 
// 取得購物車資料並渲染出列表
function getCartList() {
    axios.get(`https://hexschoollivejs.herokuapp.com/api/livejs/v1/customer/${api_path}/carts`)
    .then(function(response){
        cartData = response.data.carts;
        let cartStr = "";
        cartData.forEach(function(item){
            cartStr += `<tr>
                <td>
                    <div class="cardItem-title">
                        <img src="${item.product.images}" alt="">
                        <p>${item.product.title}</p>
                    </div>
                </td>
                <td>NT$ ${toThousands(item.product.price)}</td>
                <td>${item.quantity}</td>
                <td>NT$ ${toThousands(item.product.price * item.quantity)}</td>
                <td class="discardBtn">
                    <a href="#" class="material-icons" data-id="${item.id}">
                        clear
                    </a>
                </td>
            </tr>`;
        });
        cartList.innerHTML = cartStr;
        // 總金額
        document.querySelector('.totalProductPrice').textContent = toThousands(response.data.finalTotal);
    });
}

/*** 加入購物車 ***/
productList.addEventListener('click',function(e){
    e.preventDefault(); 
    let addCartClass = e.target.getAttribute('class');
    if(addCartClass !== "js-addCart"){
        return;
    }
    // 需在 HTML 加入購物車按鈕埋 id (data-id)（JS 第 25 行）
    let productID = e.target.getAttribute('data-id'); // 取得產品 ID
    let numCheck = 1;
    // 查看購物車是否已經有點選的商品，有就將數量 +1
    cartData.forEach(function(item){
        if(item.product.id == productID){
            numCheck = item.quantity+=1 ;
        }
    });
    // POST 新增購物車資料
    axios.post(`https://hexschoollivejs.herokuapp.com/api/livejs/v1/customer/${api_path}/carts`,{
        "data": {
            "productId": productID,
            "quantity": numCheck
        }
    })
    .then(function(response) {
        alert("加入購物車成功！");
        getCartList();
    });
});

/*** 刪除購物車資料 ***/
// 刪除單筆購物車資料
cartList.addEventListener('click',function(e){
    e.preventDefault();
    const cartID = e.target.getAttribute('data-id'); // JS 第 82 行埋入購物車 ID
    if(cartID == null){
        // alert("未刪除");
        return;
    }
    axios.delete(`https://hexschoollivejs.herokuapp.com/api/livejs/v1/customer/${api_path}/carts/${cartID}`)
    .then(function(response) {
       alert("刪除該筆購物車成功！");
       getCartList();
    });
});
// 刪除全部購物車資料
const discardAllBtn = document.querySelector('.discardAllBtn'); // 刪除所有品項按鈕 DOM
discardAllBtn.addEventListener('click',function(e){
    e.preventDefault();
    axios.delete(`https://hexschoollivejs.herokuapp.com/api/livejs/v1/customer/${api_path}/carts`)
    .then(function(response) {
       alert("刪除全部購物車商品成功！");
       getCartList();
    });
});

/*** 送出訂單 ***/
const orderInfoBtn = document.querySelector('.orderInfo-btn'); // 送出訂單按紐 DOM
orderInfoBtn.addEventListener('click',function(e){
    e.preventDefault();
    if(cartData.length == 0){
        alert("請將商品加入購物車！")
        return;
    }
    const customerName = document.querySelector('#customerName').value;
    const customerPhone = document.querySelector('#customerPhone').value;
    const customerEmail = document.querySelector('#customerEmail').value;
    const customerAddress = document.querySelector('#customerAddress').value;
    const customerTradeWay = document.querySelector('#tradeWay').value;
    if(customerName == "" || customerPhone == "" || customerEmail == "" || customerAddress == "" || customerTradeWay == ""){
        alert("請確認訂單資訊都已輸入！");
        return;
    }
    // POST 新增訂單資料
    axios.post(`https://hexschoollivejs.herokuapp.com/api/livejs/v1/customer/${api_path}/orders`,{
        "data": {
            "user": {
              "name": customerName,
              "tel": customerPhone,
              "email": customerEmail,
              "address": customerAddress,
              "payment": customerTradeWay
            }
        }
    })
    .then(function(response){
        alert("訂單送出 ~");
        document.querySelector('#customerName').value = "";
        document.querySelector('#customerPhone').value = "";
        document.querySelector('#customerEmail').value = "";
        document.querySelector('#customerAddress').value = "";
        document.querySelector('#tradeWay').value = "ATM";
        getCartList(); // 再次渲染購物車列表
    });
})


/*** Utils JS 工具類 ***/
// 千分位 參考：https://www.w3resource.com/javascript-exercises/javascript-math-exercise-39.php
function toThousands(num){
    let num_parts = num.toString().split(".");
    num_parts[0] = num_parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return num_parts.join(".");
}