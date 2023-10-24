// Set new default font family and font color to mimic Bootstrap's default styling
Chart.defaults.global.defaultFontFamily = '-apple-system,system-ui,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif';
Chart.defaults.global.defaultFontColor = '#292b2c';




// Bar Chart Example
var ctx = document.getElementById("myBarChart");

var myLineChart = new Chart(ctx, {
  type: 'bar',
  data: {
    labels: [],
    datasets: [{
      label: "상품 수",
      backgroundColor: "rgba(2,117,216,1)",
      borderColor: "rgba(2,117,216,1)",
      data: [],
    }],
  },
  options: {
    scales: {
      xAxes: [{
        time: {
          unit: 'month'
        },
        gridLines: {
          display: false
        },
        ticks: {
          maxTicksLimit: 6
        }
      }],
      yAxes: [{
        ticks: {
          min: 0,
          max: 10,
          maxTicksLimit: 5
        },
        gridLines: {
          display: true
        }
      }],
    },
    legend: {
      display: false
    }
  }
});

fetch('/category-data')
  .then(response => {
    if (!response.ok) {
      throw new Error('카테고리 데이터 가져오기 오류');
    }
    return response.json();
  })
  .then(data => {
    const categories = data.categories;
    console.log(categories);
    console.log(categories[0])

    // 카테고리 데이터를 그래프 데이터에 추가
    myLineChart.data.labels = categories.map(category => category.category);
    myLineChart.data.datasets[0].data = categories.map(category => category.count);

    myLineChart.update();
  })
  .catch(error => {
    console.error(error.message);
  })