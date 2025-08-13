#!/usr/bin/env node
/**
 * Checklist Progress Tracker - Automates MVP completion checklist updates
 * 
 * Updates the MCP MVP completion checklist based on validation results
 * and provides comprehensive progress tracking for stakeholder reporting.
 * 
 * Task: TASK-2025-012 - Implement MCP validation automation scripts
 */

const fs = require('fs');
const path = require('path');

class ChecklistTracker {
    constructor() {
        this.checklistPath = path.join(process.cwd(), 'docs/validation/mcp-mvp-completion-checklist.md');
        this.validationResultsPath = path.join(process.cwd(), 'validation-results');
        this.checklist = null;
        this.originalChecklist = null;
        
        this.loadChecklist();
    }
    
    loadChecklist() {
        if (!fs.existsSync(this.checklistPath)) {
            throw new Error(`Checklist file not found: ${this.checklistPath}`);
        }
        
        this.checklist = fs.readFileSync(this.checklistPath, 'utf8');
        this.originalChecklist = this.checklist;
        console.log('✅ Loaded MVP completion checklist');
    }
    
    markComplete(section, item, evidence = '') {
        const searchPattern = new RegExp(`- \\[ \\] \\*\\*${this.escapeRegex(item)}\\*\\*`, 'g');
        const replacePattern = `- [x] **${item}**`;
        
        if (this.checklist.match(searchPattern)) {
            this.checklist = this.checklist.replace(searchPattern, replacePattern);
            
            // Add evidence if provided
            if (evidence) {
                const evidencePattern = `- [x] **${item}**`;
                const evidenceReplacement = `${evidencePattern}\n  - ✅ Evidence: ${evidence}`;
                this.checklist = this.checklist.replace(evidencePattern, evidenceReplacement);
            }
            
            console.log(`✅ Marked complete: ${section} -> ${item}`);
            return true;
        } else {
            console.log(`⚠️  Item not found or already complete: ${item}`);
            return false;
        }
    }
    
    markIncomplete(section, item, reason = '') {
        const searchPattern = new RegExp(`- \\[x\\] \\*\\*${this.escapeRegex(item)}\\*\\*`, 'g');
        const replacePattern = `- [ ] **${item}**`;
        
        if (this.checklist.match(searchPattern)) {
            this.checklist = this.checklist.replace(searchPattern, replacePattern);
            
            // Add reason if provided
            if (reason) {
                const reasonPattern = `- [ ] **${item}**`;
                const reasonReplacement = `${reasonPattern}\n  - ❌ Issue: ${reason}`;
                this.checklist = this.checklist.replace(reasonPattern, reasonReplacement);
            }
            
            console.log(`❌ Marked incomplete: ${section} -> ${item}`);
            return true;
        }
        return false;
    }
    
    updateFromValidationResults() {
        console.log('\n🔍 Updating checklist from validation results...');
        
        try {
            // Load latest validation results
            const latestResults = this.loadLatestValidationResults();
            
            if (!latestResults) {
                console.log('⚠️  No validation results found');
                return false;
            }
            
            this.updateHealthCheckItems(latestResults);
            this.updateToolItems(latestResults);
            this.updatePerformanceItems(latestResults);
            this.updateIntegrationItems(latestResults);
            
            console.log('✅ Checklist updated from validation results');
            return true;
            
        } catch (error) {
            console.error('❌ Error updating from validation results:', error.message);
            return false;
        }
    }
    
    updateHealthCheckItems(results) {
        if (results.tests && results.tests.integration) {
            const integration = results.tests.integration;
            
            if (integration.health_check && integration.health_check.passed) {
                this.markComplete(
                    'Health & Authentication Tools',
                    'health_check - Server status and database connectivity',
                    `Validation passed with ${integration.health_check.response_time}ms response time`
                );
            }
            
            if (integration.database_connectivity && integration.database_connectivity.passed) {
                this.markComplete(
                    'Database Integration & Performance',
                    'Database Connectivity',
                    'Turso database connection validated'
                );
            }
        }
    }
    
    updateToolItems(results) {
        if (results.tests && results.tests.tools) {
            const tools = results.tests.tools;
            
            // Update individual tool checkmarks
            const toolMappings = {
                'health_check': 'health_check - Server status and database connectivity',
                'validate_auth': 'validate_auth - API token validation',
                'list_projects': 'list_projects - Get all projects (primary)',
                'get_project': 'get_project - Get specific project details (primary)',
                'create_project': 'create_project - Create new projects',
                'get_project_logs': 'get_project_logs - Get project logs metadata (primary)',
                'get_log_content': 'get_log_content - Get full log entry content',
                'create_log_entry': 'create_log_entry - Create new log entries'
            };
            
            Object.entries(toolMappings).forEach(([toolKey, checklistItem]) => {
                if (tools[toolKey] && tools[toolKey].passed) {
                    this.markComplete(
                        'Core MCP Tools Functionality',
                        checklistItem.split(' - ')[0],
                        `Tool validation passed`
                    );
                }
            });
        }
    }
    
    updatePerformanceItems(results) {
        if (results.tests && results.tests.performance) {
            const performance = results.tests.performance;
            
            if (performance.passed_percentage >= 80) {
                this.markComplete(
                    'Performance Benchmarks',
                    'Response Time Requirements',
                    `${performance.passed_percentage}% of benchmarks passed`
                );
            }
            
            // Update individual tool performance
            if (performance.health_check && performance.health_check.average_ms <= 50) {
                this.markComplete(
                    'Performance Benchmarks',
                    'health_check: <50ms average',
                    `${performance.health_check.average_ms}ms average`
                );
            }
        }
    }
    
    updateIntegrationItems(results) {
        if (results.tests && results.tests.integration) {
            const integration = results.tests.integration;
            
            if (integration.passed_tests >= integration.total_tests * 0.9) {
                this.markComplete(
                    'API Compatibility & Standards',
                    'Response Format Standardization',
                    `${integration.passed_tests}/${integration.total_tests} integration tests passed`
                );
            }
        }
    }
    
    loadLatestValidationResults() {
        if (!fs.existsSync(this.validationResultsPath)) {
            return null;
        }
        
        const files = fs.readdirSync(this.validationResultsPath)
            .filter(f => f.endsWith('.json'))
            .sort()
            .reverse();
            
        if (files.length === 0) {
            return null;
        }
        
        const latestFile = files[0];
        const filePath = path.join(this.validationResultsPath, latestFile);
        
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(content);
        } catch (error) {
            console.error(`Error reading ${latestFile}:`, error.message);
            return null;
        }
    }
    
    saveChecklist() {
        fs.writeFileSync(this.checklistPath, this.checklist);
        console.log('💾 Checklist saved successfully');
    }
    
    getCompletionStatus() {
        const totalItems = (this.checklist.match(/- \[ \]/g) || []).length + 
                          (this.checklist.match(/- \[x\]/g) || []).length;
        const completedItems = (this.checklist.match(/- \[x\]/g) || []).length;
        const percentage = Math.round((completedItems / totalItems) * 100);
        
        return {
            total: totalItems,
            completed: completedItems,
            percentage: percentage,
            mvp_ready: percentage >= 90
        };
    }
    
    generateProgressReport() {
        const status = this.getCompletionStatus();
        const changes = this.getChanges();
        
        const report = {
            timestamp: new Date().toISOString(),
            completion_status: status,
            changes_made: changes.length,
            changes: changes,
            mvp_assessment: {
                ready_for_deployment: status.mvp_ready,
                completion_threshold: 90,
                current_completion: status.percentage,
                gaps_remaining: 100 - status.percentage
            },
            next_actions: this.generateNextActions(status)
        };
        
        return report;
    }
    
    getChanges() {
        const originalCompleted = (this.originalChecklist.match(/- \[x\]/g) || []).length;
        const currentCompleted = (this.checklist.match(/- \[x\]/g) || []).length;
        
        return Array.from({ length: currentCompleted - originalCompleted }, (_, i) => ({
            type: 'completion',
            description: `Item marked complete during this session`,
            timestamp: new Date().toISOString()
        }));
    }
    
    generateNextActions(status) {
        const actions = [];
        
        if (status.percentage < 50) {
            actions.push('Focus on completing core MCP tools functionality');
            actions.push('Run comprehensive tool validation suite');
        } else if (status.percentage < 75) {
            actions.push('Complete performance benchmark validation');
            actions.push('Implement remaining integration tests');
        } else if (status.percentage < 90) {
            actions.push('Address final validation gaps');
            actions.push('Complete production readiness checklist');
        } else {
            actions.push('Ready for MVP deployment');
            actions.push('Schedule stakeholder review');
        }
        
        return actions;
    }
    
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    printStatusReport() {
        const status = this.getCompletionStatus();
        const progressBar = this.generateProgressBar(status.percentage);
        
        console.log('\n📊 MCP MVP Completion Status');
        console.log('=============================');
        console.log(`Progress: ${progressBar} ${status.percentage}%`);
        console.log(`Completed: ${status.completed}/${status.total} items`);
        console.log(`MVP Ready: ${status.mvp_ready ? '✅ YES' : '❌ NO'} (90% threshold)`);
        
        if (status.mvp_ready) {
            console.log('\n🎉 Congratulations! MVP completion criteria met!');
        } else {
            const remaining = Math.ceil((90 - status.percentage) / 100 * status.total);
            console.log(`\n⚠️  ${remaining} more items needed for MVP completion`);
        }
    }
    
    generateProgressBar(percentage, width = 20) {
        const filled = Math.round(percentage / 100 * width);
        const empty = width - filled;
        return '█'.repeat(filled) + '░'.repeat(empty);
    }
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);
    const options = {};
    
    // Parse command line arguments
    args.forEach(arg => {
        if (arg === '--auto-detect') options.autoDetect = true;
        if (arg === '--update-from-results') options.updateFromResults = true;
        if (arg === '--status-only') options.statusOnly = true;
        if (arg === '--save') options.save = true;
        if (arg.startsWith('--section=')) options.section = arg.split('=')[1];
        if (arg.startsWith('--item=')) options.item = arg.split('=')[1];
    });
    
    try {
        const tracker = new ChecklistTracker();
        
        if (options.statusOnly) {
            tracker.printStatusReport();
            return;
        }
        
        if (options.updateFromResults || options.autoDetect) {
            const updated = tracker.updateFromValidationResults();
            
            if (updated && options.save !== false) {
                tracker.saveChecklist();
            }
        }
        
        // Generate and save progress report
        const report = tracker.generateProgressReport();
        
        const reportsDir = path.join(process.cwd(), 'validation-results');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }
        
        const reportFile = path.join(reportsDir, `checklist-progress-${Date.now()}.json`);
        fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
        
        console.log(`\n📋 Progress report saved: ${reportFile}`);
        
        tracker.printStatusReport();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Export for use in other scripts
module.exports = { ChecklistTracker };

// Run if called directly
if (require.main === module) {
    main();
}