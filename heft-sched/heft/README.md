# HEFT: Heterogeneous Earliest Finish Time

[![Github Actions](https://github.com/mackncheesiest/heft/workflows/GH%20Actions/badge.svg)](https://github.com/mackncheesiest/heft/actions)
<!--
[![CircleCI](https://circleci.com/gh/mackncheesiest/heft.svg?style=svg)](https://circleci.com/gh/mackncheesiest/heft)
-->

A Python 3.6+ implementation of a heuristic DAG scheduling approach from 

`H. Topcuoglu, S. Hariri and Min-You Wu, "Performance-effective and low-complexity task scheduling for heterogeneous computing," in IEEE Transactions on Parallel and Distributed Systems, vol. 13, no. 3, pp. 260-274, March 2002.`

[IEEE Explore Link](https://ieeexplore.ieee.org/document/993206)


## Installation
Setting up a virtual environment first is recommended

After that, all necessary dependencies can be installed with `pip install -r requirements.txt`

Finally, if you want it available as a local package for availability elsewhere on your system, it can be installed with `pip install .`

## Command line Usage
Basic usage is given by `python -m heft.heft -h`

```
usage: heft.py [-h] [-d DAG_FILE] [-p PE_CONNECTIVITY_FILE]                             
               [-t TASK_EXECUTION_FILE]                                                 
               [-l {DEBUG,INFO,WARNING,ERROR,CRITICAL}] [--showDAG]                     
               [--showGantt]                                                            
                                                                                        
A tool for finding HEFT schedules for given DAG task graphs                             
                                                                                        
optional arguments:                                                                     
  -h, --help            show this help message and exit                                 
  -d DAG_FILE, --dag_file DAG_FILE                                                      
                        File containing input DAG to be scheduled. Uses                 
                        default 10 node dag from Topcuoglu 2002 if none given.          
  -p PE_CONNECTIVITY_FILE, --pe_connectivity_file PE_CONNECTIVITY_FILE                  
                        File containing connectivity/bandwidth information              
                        about PEs. Uses a default 3x3 matrix from Topcuoglu             
                        2002 if none given.                                             
  -t TASK_EXECUTION_FILE, --task_execution_file TASK_EXECUTION_FILE                     
                        File containing execution times of each task on each            
                        particular PE. Uses a default 10x3 matrix from                  
                        Topcuoglu 2002 if none given.                                   
  -l {DEBUG,INFO,WARNING,ERROR,CRITICAL}, --loglevel {DEBUG,INFO,WARNING,ERROR,CRITICAL}
                        The log level to be used in this module. Default: INFO          
  --showDAG             Switch used to enable display of the incoming task DAG          
  --showGantt           Switch used to enable display of the final scheduled            
                        Gantt chart                                                     
```

If you don't have any particular DAG that needs scheduling, the canonical example schedule from Topcuoglu et al. can be generated by passing in no args

`python -m heft.heft`

With a generated Gantt chart available using

`python -m heft.heft --showGantt`

## Usage as an external library

Example usage as an external library is given by [this notebook](https://github.com/mackncheesiest/heft/blob/master/jupyter/HEFT_Example.ipynb)

## Testing
If Pytest is installed, tests can be executed simply by running `pytest` from the repository root directory