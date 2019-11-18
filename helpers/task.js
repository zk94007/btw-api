const moment = require('moment');
const { orderBy, groupBy, take, sumBy } = require('lodash');
const Task = require('../models/Task');
const User = require('../models/User');

const mapDashboardLeaderboard = (dates, data, previousData, performersLimit = 10) => {
    const formatDate = date => date.format('MMM DD');
    const resolvePerformers = () => {
        return take(orderBy(data, 'points', 'desc'), performersLimit);
    };
    const resolveChartData = (data, dates) => {
        const allTasks = data.reduce((allTasks, item) => {
            const userTasks = item.tasks.map(task => {
                task.date = formatDate(moment(task.date).startOf('day'));
                return task;
            });

            return [...allTasks, ...userTasks];
        }, []);

        const groupedData = groupBy(allTasks, 'date');

        return {
            tasks: allTasks.length,
            startDate: formatDate(moment(dates.dateFrom)),
            endDate: formatDate(moment(dates.dateTo)),
            data: [...Array(7).keys()].map(day => {
                const date = formatDate(moment(dates.dateFrom).add(day, 'days'));
                return groupedData[date] ? sumBy(groupedData[date], 'points') : 0;
            })
        }
    };

    return {
        performers: resolvePerformers(),
        previousData,
        performanceData: {
            main: resolveChartData(data, dates.current),
            previous: resolveChartData(previousData, dates.previous)
        }
    }
};

const getDay = (type, isStart) => {
    const date = moment().subtract(1, `${type}s`);
    return isStart
        ? date.startOf(type).toDate()
        : date.endOf(type).toDate();
};

const getLeaderboardQuery = (dateFrom, dateTo) => {
    return [
        { $match: {status: 'completed', updatedAt: {$gte: dateFrom, $lte: dateTo } } },
        { $group: {
                _id: "$userId",
                points: { $sum: "$points" },
                activeTasks: { $sum: 1 },
                tasks: { $push: { points: "$points", date: "$updatedAt" } }
            }},

    ];
};

async function getLeaderBoard(dateFrom, dateTo) {
    const usersForLeaderBoard = await Task.aggregate(getLeaderboardQuery(dateFrom, dateTo));

    const arrayOfPromises = usersForLeaderBoard.map(async userForLeaderBoard => {
        const user = await User.findOne({_id: userForLeaderBoard._id});
        if (user !== null) {
            userForLeaderBoard.firstName = user.firstname;
            userForLeaderBoard.lastName = user.lastname;
            userForLeaderBoard.src = user.profileImageUrl;
        }
        return userForLeaderBoard;
    });

    return  await Promise.all(arrayOfPromises);
}


module.exports = {
    mapDashboardLeaderboard,
    getLeaderBoard,
    getDay
};
