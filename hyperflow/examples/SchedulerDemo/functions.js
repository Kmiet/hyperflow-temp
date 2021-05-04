const { newContexts } = require("@kubernetes/client-node/dist/config_types");

const sleep = async (ms) => await new Promise(r => setTimeout(r, ms));

// Using synchronous scheduler API
async function taskFunction1(ins, outs, context, cb) {
	let scheduler = context.appConfig.scheduler;
	if (scheduler) {
		var node = await scheduler.getTaskExecutionPermission(context.appId, context.procId);
	}

	console.log("Got scheduler permission, executing task on node", node);
	
	if (scheduler) {
		await sleep(3000);
		scheduler.notifyTaskCompletion(context.appId, context.procId);
	}

	// console.log(scheduler.tasks)
	cb(null, outs);
}


// Using asynchronous scheduler API
function taskFunction2(ins, outs, context, cb) {
	let taskItem = { 
		"ins": ins, 
		"outs": outs, 
		"context": context, 
		"cb": cb
	}

	let scheduler = context.appConfig.scheduler;

	if (scheduler) {
		return scheduler.addTaskItem(taskItem, taskFunction2Cb);
	}

}

async function taskFunction2Cb(taskArray, node) {
	console.log("Got scheduler callback, executing task array on node", node);
	if (taskArray[0] && taskArray[0].context.procId == 3) {
		await sleep(5000);
	} else {
		await sleep(3000);
	}
	taskArray.forEach(async (task) => {
		let scheduler = task.context.appConfig.scheduler;
		// if (task.context.procId == 2) {
		// 	await sleep(5000);
		// } else {
		// 	await sleep(3000);
		// }
		scheduler.notifyTaskCompletion(task.context.appId, task.context.procId);
		task.cb(null, task.outs);
	});
}

exports.taskFunction1 = taskFunction1;
exports.taskFunction2 = taskFunction2;
