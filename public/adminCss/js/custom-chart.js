// (function ($) {
//     "use strict";

//     /*Sale statistics Chart*/
//     if ($('#myChart').length) {
//         var ctx = document.getElementById('myChart');
//         var chart = new Chart(ctx, {
//             // The type of chart we want to create
//             type: 'line',

//             // The data for our dataset
//             data: {
//                 labels:labels,
//                 datasets: [{
//                     label: 'Sales',
//                     tension: 0.3,
//                     fill: true,
//                     backgroundColor: 'rgba(44, 120, 220, 0.2)',
//                     borderColor: 'rgba(44, 120, 220)',
//                     data: salesArray,
//                 },
//                 {
//                     label: 'Visitors',
//                     tension: 0.3,
//                     fill: true,
//                     backgroundColor: 'rgba(4, 209, 130, 0.2)',
//                     borderColor: 'rgb(4, 209, 130)',
//                     data: [40, 20, 17, 9, 23, 35, 39, 30, 34, 25, 27, 17]
//                 },
//                 {
//                     label: 'Products',
//                     tension: 0.3,
//                     fill: true,
//                     backgroundColor: 'rgba(380, 200, 230, 0.2)',
//                     borderColor: 'rgb(380, 200, 230)',
//                     data: [30, 10, 27, 19, 33, 15, 19, 20, 24, 15, 37, 6]
//                 }

//                 ]
//             },
//             options: {
//                 plugins: {
//                     legend: {
//                         labels: {
//                             usePointStyle: true,
//                         },
//                     }
//                 }
//             }
//         });
//     } //End if

//     /*Sale statistics Chart*/
//     if ($('#myChart2').length) {
//         var ctx = document.getElementById("myChart2").getContext('2d');
//         var myChart = new Chart(ctx, {
//             type: 'bar',
//             data: {
//                 labels: labels,
//                 datasets: [{
//                     label: "Sales",
//                     backgroundColor: "#5897fb",
//                     barThickness: 30,
//                     data: salesArray,
//                 }]
//             },
//             options: {
//                 plugins: {
//                     legend: {
//                         labels: {
//                             usePointStyle: true,
//                         },
//                     },
//                     tooltip: {
//                         callbacks: {
//                             label: function (context) {
//                                 const dataIndex = context.dataIndex;
//                                 const dateString = dates[dataIndex];
//                                 return `${context.dataset.label}: ${context.formattedValue} (${dateString})`;
//                             }
//                         }
//                     }
//                 },
//                 scales: {
//                     y: {
//                         beginAtZero: true
//                     }
//                 }
//             }
//         });
//     } //end if

// })(jQuery);






(function ($) {
    "use strict";

    /*Sale statistics Chart*/
    if ($('#myChart2').length) {
        var ctx = document.getElementById("myChart2").getContext('2d');
        
        // Assuming salesDataJSON is defined globally in your EJS template
        const salesData = JSON.parse(salesDataJSON);
        const labels = salesData.map(item => item._id);
        const salesArray = salesData.map(item => item.total);

        var myChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: "Sales",
                    backgroundColor: "#5897fb",
                    barThickness: 30,
                    data: salesArray,
                }]
            },
            options: {
                plugins: {
                    legend: {
                        labels: {
                            usePointStyle: true,
                        },
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return `${context.dataset.label}: ₹${context.formattedValue}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value, index, values) {
                                return '₹' + value;
                            }
                        }
                    }
                }
            }
        });
    } //end if

    // Add event listener for filter change
    $('#filterSelect').on('change', function() {
        const selectedFilter = $(this).val();
        window.location.href = `/admin/dashboard?filter=${selectedFilter}`;
    });

})(jQuery);