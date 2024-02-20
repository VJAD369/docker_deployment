import express, { query } from "express";
import mysql from "mysql";
import fs from "node:fs";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

const __dirname = path.dirname(new URL(import.meta.url).pathname);


import {Client}  from '@elastic/elasticsearch';


const db = mysql.createConnection({
  host: process.env.MYSQL_HOST || "localhost",
  user: process.env.MYSQL_USER||"root",
  password: process.env.MYSQL_PASSWORD || "Vijai369$",
  database: process.env.MYSQL_DATABASE||"testDB",
});

const esClient = new Client({ node: `http://${process.env.ELASTICSEARCH_HOST || 'localhost'}:9200` });


const app = express();
const port = 4000;

const dirName = process.cwd();

app.use(cors());

app.use(express.static(path.join(__dirname, '../frontend')));


db.connect((err) => {
  if (err) {
    console.error("Error connecting to the database: ", err);
    return;
  }
  console.log("Connected to the database");
});

function generatePaginationLinks(page, numberOfPages, baseLink) {
  let paginationHtml = '<div class="pagination">';
  if (page > 1) {
    paginationHtml += `<a href="${baseLink}?page=${page - 1}" class="page-link" onclick="loadProducts(${page - 1})">Previous</a>`;
  }
  for (let i = 1; i <= numberOfPages; i++) {
    paginationHtml += `<a href="${baseLink}?page=${i}" class="page-link" onclick="loadProducts(${i})">${i}</a>`;
  }
  if (page < numberOfPages) {
    paginationHtml += `<a href="${baseLink}?page=${page + 1}" class="page-link" onclick="loadProducts(${page + 1})">Next</a>`;
  }
  paginationHtml += '</div>';


  return paginationHtml;

}

app.get("/categories", (req, res) => {
  const categoryId = req.query.category_id;
  const page = parseInt(req.query.page) || 1;

  const rowsPerPage = 5;
  const offset = (page - 1) * rowsPerPage;

  let query = "SELECT * FROM category";
  let queryParams = [];


  if (categoryId != 0 && categoryId !=null) {
    query += " WHERE category_id = ?";
    query += " LIMIT ? OFFSET ?";
    queryParams = [categoryId, rowsPerPage, offset];
  } 

  else {
    query= "SELECT * FROM category"
    query += " LIMIT ? OFFSET ?";
    queryParams = [rowsPerPage, offset];
  }

  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error("Error executing query: ", err);
      res.status(500).send("Internal Server Error");
      return;
    }

    res.json(results);
  });
});


app.get("/product", (req, res) => {
  const filePath = path.join(__dirname, '/frontend/product.html');
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error("Error sending file:", err);
      res.status(500).send("Internal Server Error");
    }
  });
});

app.get("/category", (req, res) => {
  const filePath = path.join(__dirname, '/frontend/category.html');
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error("Error sending file:", err);
      res.status(500).send("Internal Server Error");
    }
  });
});


app.get("/categoryTable",(req,res)=>{
  let CategoryQuery = "SELECT * FROM category";
  db.query(CategoryQuery, (err, results) => {
    if (err) {
      console.error("Error executing query: ", err);
      return;
    }

     res.json(results);
  });
})

app.get("/numberOfPages",(req,res)=>{

  let query = "select * from product";
  db.query(query, (err, results) => {
    if (err) {
      console.error("Error executing query: ", err);
      return;
    }
   

    res.json(results);
  
  });
})

app.get("/products", (req, res) => {
  const categoryId = req.query.category_id;
  const page = parseInt(req.query.page) || 1;

  const rowsPerPage = 5;
  const offset = (page - 1) * rowsPerPage;

  let query = "SELECT * FROM product";
  let queryParams = [];


  if (categoryId != 0 && categoryId !=null) {
    query += " WHERE category_id = ?";
    query += " LIMIT ? OFFSET ?";
    queryParams = [categoryId, rowsPerPage, offset];
  } 
  else {
    query += " LIMIT ? OFFSET ?";
    queryParams = [rowsPerPage, offset];
  }

  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error("Error executing query: ", err);
      res.status(500).send("Internal Server Error");
      return;
    }

    res.json(results);
  });
});


function categoryTable(data,page,numberOfPages,baseLink) {
  let html = `
    <table class="table shadow-lg">
      <thead class="table-dark">
        <tr>
          <th scope="col">S.No</th>
          <th scope="col">Category Id</th>
          <th scope="col">Category Name</th>
          <th scope="col">Stocks</th>
          <th scope="col">Created Date</th>
        </tr>
      </thead>
      <tbody>
  `;

  data.forEach((row, index) => {
    html += `
      <tr>
        <th scope="row">${index + 1}</th>
        <td>${row.category_id}</td>
        <td><a href="/products?category_id=${row.category_id}">${
      row.category_name
    }</td>
        <td>${row.stock_quantity}</td>
        <td>${new Date(row.created_date).toLocaleDateString("en-GB")}</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  if (numberOfPages >= 1) {
    html += generatePaginationLinks(page, numberOfPages, baseLink);
  }

  return html;
}

let searchedCat;

app.get("/productRedirect",(req,res)=>
{
  searchedCat = req.query.category_id;
  res.sendFile(path.join(__dirname,"/frontend/search.html"));
});

app.get("/productRedirect/Data",(req,res)=>{

  const categoryId = searchedCat;
  const page = parseInt(req.query.page) || 1;

  const rowsPerPage = 5;
  const offset = (page - 1) * rowsPerPage;
  let queryParams;

  let query = "SELECT * FROM product where category_id=?";

  query += " LIMIT ? OFFSET ?";
  queryParams = [categoryId, rowsPerPage, offset];

  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error("Error executing query: ", err);
      res.status(500).send("Internal Server Error");
      return;
    }

    res.json(results);
  });

})



function productTable(data,dropDown, page, numberOfPages, baseLink) {



  let html =
    dropDown +
    `
      <table class="table shadow-lg">
        <thead class="table-dark">
          <tr>
            <th scope="col">S.No</th>
            <th scope="col">Product ID</th>
            <th scope="col">Product Name</th>
            <th scope="col">Category Name</th>
            <th scope="col">Brand</th>
            <th scope="col">MRP</th>
            <th scope="col">Discounted Price</th>
            <th scope="col">Category Id</th>
            <th scope="col">Created Date</th>
          </tr>
        </thead>
        <tbody>
    `;
  data.forEach((row, index) => {
    html += `
        <tr>
          <th scope="row">${index + 1}</th>
          <td>${row.product_id}</td>
          <td>${row.product_name}</td>
          <td>${row.category_name}</td>
          <td>${row.brand}</td>
          <td>${row.mrp}</td>
          <td>${row.discounted_price}</td>
          <td>${row.category_id}</td>
          <td>${new Date(row.created_date).toLocaleDateString("en-GB")}</td>
        </tr>
      `;
  });

  html += `
        </tbody>
      </table>
    `;


    if (numberOfPages > 1) {
      html += generatePaginationLinks(page, numberOfPages, baseLink);
    }

    return html; 
}

app.get('/product/data', async (req, res) => {

 
  let rowsPerPage =5;
  const page = parseInt(req.query.page) || 1;
  var query = req.query.query;
  var down=["under","below","less","within","down","lesser","in","@","between","@"];

  var up=["over","above","greater","up","to",];
  var extra=[",",".","/",":","[","]","rs","Rs","amt","Amt","+","-","than"];

  var string=query.split(" ")
  var cur,cur1,cur2,sort,sort1="lte",sort2="gte";

  const offset = (page - 1) * rowsPerPage;
  

  query = extra.reduce((acc, val) => acc.split(val).join(''), query);


  string.forEach(val => {
    if(down.includes(val)){
      cur1=val;
      cur=val;
      sort="lte";
      sort1=sort;
      return;
      
    }
    else if(up.includes(val)){
      cur2=val;
      cur= val;
      sort="gte";
      sort2=sort;
      return;
    }
    
  });


  if(cur1 && cur2)
  {
    
      const regex1 = new RegExp(`\\s+${cur1}\\s+`, 'i');
      const regex2 = new RegExp(`\\s+${cur2}\\s+`, 'i');
      var [data, price1, price2] = query.split(regex1).flatMap(fragment => fragment.split(regex2));
      var value1= price1;
      var value2= price2;
  }
  else{
   
  if(cur){
    var [data,price] = query.split(cur);
    var value=parseFloat(price);    
    if(sort == "lte")
    {
      value1=0;
      value2=value;
    }else{
      value1=value;
      value2=0;
    }
  }
  else{
    var data=query;
    var value1=0;
    var value2=10000000;
    sort="lte";
   
  }}
 
 

  try {
    let body  = await esClient.search({
        index: "my_index",
        body: {
          query: {
            bool: {
              must: [
                {
                  exists: {
                    field: "discounted_price"
                  }
                },
                {
                  range: {
                    discounted_price: {
                      [sort2]: value1,
                      [sort1]:value2
                    }
                  }
                }
              ],
              should: [
                {
                  multi_match: {
                    query: data,
                    fields: ["product_name","brand","category_name"],
                    // operator: "and", 
                    // fuzziness: "auto"
                  }
                }
              ],
              minimum_should_match: 1
            }
          },
          // sort: [
          //   {
          //     discounted_price: {
          //       order: 'asc'
          //     }
          //   }
          // ],
        _source:['product_id','product_name','brand','category_name','mrp','discounted_price','category_id','created_date'],
        size: rowsPerPage,
        from: offset,
       
      }
    });

  
    if (body && body.hits) {
      let data=body.hits.hits;
      const results = data.map(hit => hit._source);

      const totalHits = body.hits.total.value; // Adjust accordingly based on your Elasticsearch version
      const totalPages = Math.ceil(totalHits / rowsPerPage);
   
    
      
    
 if (results.length != 0) {

        res.json({
          results: results,
          totalPages: totalPages,
        });
      
    }

    } else {
      console.error('Invalid Elasticsearch response:', body);
      res.status(500).send('Invalid Elasticsearch response');
    }
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
   
});



async function searchProducts(query, offset, limit) {
  

  var down=["under","below","less","within","down","lesser","in","@","between"];
  var eq=["=","@"]
  var up=["over","above","greater","up","and","to",];
  var extra=[",",".","/",":","[","]","rs","Rs","amt","Amt","+","-","than"];

  var string=query.split(" ")
  var cur,cur1,cur2,sort,sort1="lte",sort2="gte";



  query = extra.reduce((acc, val) => acc.split(val).join(''), query);


  string.forEach(val => {
    if(down.includes(val)){
      cur1=val;
      cur=val;
      sort="lte";
      sort1=sort;
      return;
  
    }
    else if(up.includes(val)){
      cur2=val;
      cur= val;
      sort="gte";
      sort2=sort;
      return;
    }
    
  });
 

  if(cur1 && cur2)
  {
      
      const regex1 = new RegExp(`\\s+${cur1}\\s+`, 'i');
      const regex2 = new RegExp(`\\s+${cur2}\\s+`, 'i');
      var [data, price1, price2] = query.split(regex1).flatMap(fragment => fragment.split(regex2));
      var value1= price1;
      var value2= price2;
  }
  else{
   
  if(cur){
    var [data,price] = query.split(cur);
    var value=parseFloat(price);    
    if(sort == "lte")
    {
      value1=0;
      value2=value;
    }else{
      value1=value;
      value2=0;
    }
  }
  else{
    var data=query;
    var value1=0;
    var value2=10000000;
    sort="lte";

  }}
  
  const body = await esClient.search({
    index: "my_index",
            body: {
              query: {
                bool: {
                  must: [
                    {
                      exists: {
                        field: "discounted_price"
                      }
                    },
                    {
                      range: {
                        discounted_price: {
                          [sort2]: value1,
                          [sort1]:value2
                        }
                      }
                    }
                  ],
                  should: [
                    {
                      multi_match: {
                        query: data,
                        fields: ["product_name","brand","category_name"],
                        fuzziness: "auto"
                      }
                    }
                  ],
                  minimum_should_match: 1
                }
              },
              sort: [
                {
                  discounted_price: {
                    order: 'asc'
                  }
                }
              ],
            _source:['product_id','product_name','brand','category_name','mrp','discounted_price','category_id','created_date'],
            from: offset,
            size: limit,  
          }   
  });

  if (body && body.hits) {
    return body.hits.hits.map(hit => hit._source);

  } else {
    console.error('Invalid Elasticsearch response:', body);
    return [];
  }
}

function resultTable(data, baseLink,dropDown,page) {
  
  const rowsPerPage = 5;
  const totalCount = data.length;

  let html = dropDown+`
    <table class="table shadow-lg">
      <thead class="table-dark">
        <tr>
          <th scope="col">S.No</th>
          <th scope="col">Product ID</th>
          <th scope="col">Product Name</th>
          <th scope="col">Category Name</th>
          <th scope="col">Brand</th>
          <th scope="col">MRP</th>
          <th scope="col">Discounted Price</th>
          <th scope="col">Category Id</th>
          <th scope="col">Created Date</th>
        </tr>
      </thead>
      <tbody>
  `;

  data.forEach((row, index) => {
    html += `
      <tr>
        <th scope="row">${index + 1}</th>
        <td>${row.product_id}</td>
        <td>${row.product_name}</td>
        <td>${row.category_name}</td>
        <td>${row.brand}</td>
        <td>${row.mrp}</td>
        <td>${row.discounted_price}</td>
        <td>${row.category_id}</td>
        <td>${new Date(row.created_date).toLocaleDateString("en-GB")}</td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  const numberOfPages = Math.ceil(totalCount / rowsPerPage);

  if (numberOfPages >= 1) {
    html += generatePaginationLinks(page, numberOfPages, baseLink);
  }

  return html;
}


app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
