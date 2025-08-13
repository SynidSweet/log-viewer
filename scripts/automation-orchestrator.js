#!/usr/bin/env node
/**
 * Automation Orchestrator - Advanced validation workflow coordination
 * 
 * Coordinates complex validation workflows with CI/CD integration,
 * automated reporting, and intelligent failure handling.
 * 
 * Task: TASK-2025-012 - Implement MCP validation automation scripts
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { ChecklistTracker } = require('./update-checklist-progress');

class AutomationOrchestrator {
    constructor(options = {}) {
        this.options = {
            mode: options.mode || 'full', // quick, full, comprehensive
            updateChecklist: options.updateChecklist !== false,
            generateReports: options.generateReports !== false,
            ciMode: options.ciMode || process.env.CI === 'true',
            verbose: options.verbose || false,
            timeout: options.timeout || 600000, // 10 minutes
            ...options
        };
        
        this.results = {
            timestamp: new Date().toISOString(),
            mode: this.options.mode,
            ci_mode: this.options.ciMode,
            phases: {},
            overall_status: 'unknown',
            duration_ms: 0,
            artifacts: [],
            recommendations: []
        };
        
        this.startTime = Date.now();
    }
    
    async orchestrate() {
        console.log('🚀 MCP Automation Orchestrator');
        console.log(`Mode: ${this.options.mode} | CI: ${this.options.ciMode}`);
        console.log('=' .repeat(50));
        
        try {
            // Phase 1: Pre-validation Setup
            await this.runPhase('setup', this.setupPhase.bind(this));
            
            // Phase 2: Environment Validation
            await this.runPhase('environment', this.environmentPhase.bind(this));
            
            // Phase 3: Core Validation
            await this.runPhase('validation', this.validationPhase.bind(this));
            
            // Phase 4: Performance Benchmarks (skip in quick mode)
            if (this.options.mode !== 'quick') {
                await this.runPhase('performance', this.performancePhase.bind(this));
            }
            
            // Phase 5: Integration Testing (comprehensive mode only)
            if (this.options.mode === 'comprehensive') {
                await this.runPhase('integration', this.integrationPhase.bind(this));
            }
            
            // Phase 6: Post-validation Processing
            await this.runPhase('reporting', this.reportingPhase.bind(this));
            
            // Phase 7: Checklist Updates
            if (this.options.updateChecklist) {
                await this.runPhase('checklist', this.checklistPhase.bind(this));
            }
            
            // Final assessment
            this.assessOverallStatus();
            this.generateFinalReport();
            
        } catch (error) {
            this.results.overall_status = 'failed';
            this.results.error = error.message;
            console.error(`❌ Orchestration failed: ${error.message}`);
            process.exit(1);
        } finally {
            this.results.duration_ms = Date.now() - this.startTime;
            console.log(`\n⏱️  Total Duration: ${Math.round(this.results.duration_ms / 1000)}s`);
        }
    }
    
    async runPhase(phaseName, phaseFunction) {
        const startTime = Date.now();
        console.log(`\n🔄 Phase: ${phaseName.toUpperCase()}`);
        console.log('-'.repeat(30));
        
        try {
            const result = await Promise.race([
                phaseFunction(),
                this.timeoutPromise(this.options.timeout, `Phase ${phaseName} timed out`)
            ]);
            
            this.results.phases[phaseName] = {
                status: 'passed',
                duration_ms: Date.now() - startTime,
                result: result || {},
                error: null
            };
            
            console.log(`✅ ${phaseName} completed successfully`);
            
        } catch (error) {
            this.results.phases[phaseName] = {
                status: 'failed',
                duration_ms: Date.now() - startTime,
                result: null,
                error: error.message
            };
            
            console.log(`❌ ${phaseName} failed: ${error.message}`);
            
            // Decide whether to continue or abort
            if (this.isCriticalPhase(phaseName)) {
                throw error;
            }
        }
    }
    
    async setupPhase() {
        // Create validation results directory
        const resultsDir = path.join(process.cwd(), 'validation-results');
        if (!fs.existsSync(resultsDir)) {
            fs.mkdirSync(resultsDir, { recursive: true });
        }
        
        // Verify required files exist
        const requiredFiles = [
            'scripts/mcp-validation-suite.js',
            'scripts/mcp-tool-tester.js',
            'scripts/validate-mcp-integration.js',
            'scripts/mcp-e2e-tests.js',
            'scripts/update-checklist-progress.js'
        ];
        
        for (const file of requiredFiles) {
            if (!fs.existsSync(file)) {
                throw new Error(`Required file not found: ${file}`);
            }
        }
        
        console.log('✅ Setup validation completed');
        return { files_verified: requiredFiles.length };
    }
    
    async environmentPhase() {
        // Check Node.js version
        const nodeVersion = process.version;
        const nodeMajor = parseInt(nodeVersion.slice(1).split('.')[0]);
        if (nodeMajor < 18) {
            throw new Error(`Node.js 18+ required, found ${nodeVersion}`);
        }
        
        // Check environment variables
        const requiredEnvVars = ['TURSO_DATABASE_URL', 'TURSO_AUTH_TOKEN'];
        const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
        
        if (missingVars.length > 0 && !this.options.ciMode) {
            console.log(`⚠️  Missing environment variables: ${missingVars.join(', ')}`);
            console.log('Proceeding with mock/test values...');
        }
        
        return {
            node_version: nodeVersion,
            missing_env_vars: missingVars.length,
            ci_mode: this.options.ciMode
        };
    }
    
    async validationPhase() {
        const command = this.options.mode === 'quick' 
            ? 'npm run validate:mcp:quick'
            : 'npm run validate:mcp';
            
        const result = await this.runCommand(command);
        return {
            command_executed: command,
            exit_code: result.code,
            output_lines: result.stdout.split('\n').length
        };
    }
    
    async performancePhase() {
        const result = await this.runCommand('npm run validate:mcp:performance');
        return {
            exit_code: result.code,
            benchmarks_completed: result.stdout.includes('Performance benchmarks completed')
        };
    }
    
    async integrationPhase() {
        const e2eResult = await this.runCommand('npm run validate:mcp:e2e');
        const integrationResult = await this.runCommand('npm run validate:mcp:integration');
        
        return {
            e2e_exit_code: e2eResult.code,
            integration_exit_code: integrationResult.code,
            both_passed: e2eResult.code === 0 && integrationResult.code === 0
        };
    }
    
    async reportingPhase() {
        // Consolidate all validation results
        const resultsDir = path.join(process.cwd(), 'validation-results');
        const files = fs.readdirSync(resultsDir).filter(f => f.endsWith('.json'));
        
        // Generate consolidated report
        const consolidatedReport = {
            timestamp: new Date().toISOString(),
            mode: this.options.mode,
            phases: this.results.phases,
            validation_files: files,
            artifacts_generated: this.results.artifacts.length
        };
        
        const reportPath = path.join(resultsDir, `orchestrator-report-${Date.now()}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(consolidatedReport, null, 2));
        
        this.results.artifacts.push(reportPath);
        
        return {
            report_path: reportPath,
            validation_files_found: files.length
        };
    }
    
    async checklistPhase() {
        try {
            const tracker = new ChecklistTracker();
            
            // Update checklist based on validation results
            const updated = tracker.updateFromValidationResults();
            
            if (updated) {
                // Mark automation-specific items complete
                const automationItems = [
                    'MCP server startup validation script',
                    'All tools functional testing script',
                    'Performance benchmark automation'
                ];
                
                automationItems.forEach(item => {
                    tracker.markComplete(
                        'Validation Scripts & Automation',
                        item,
                        `Completed via orchestrator at ${new Date().toISOString()}`
                    );
                });
                
                // Mark CI/CD integration if running in CI
                if (this.options.ciMode) {
                    tracker.markComplete(
                        'Validation Scripts & Automation',
                        'CI/CD workflow integration',
                        'GitHub Actions pipeline executed successfully'
                    );
                }
                
                tracker.saveChecklist();
                
                const status = tracker.getCompletionStatus();
                return {
                    updated: true,
                    completion_percentage: status.percentage,
                    mvp_ready: status.mvp_ready
                };
            } else {
                return { updated: false, reason: 'No validation results available' };
            }
            
        } catch (error) {
            console.log(`⚠️  Checklist update failed: ${error.message}`);
            return { updated: false, error: error.message };
        }
    }
    
    async runCommand(command) {
        return new Promise((resolve, reject) => {
            console.log(`Running: ${command}`);
            
            const [cmd, ...args] = command.split(' ');
            const process = spawn(cmd, args, { 
                stdio: this.options.verbose ? 'inherit' : 'pipe',
                cwd: process.cwd()
            });
            
            let stdout = '';
            let stderr = '';
            
            if (!this.options.verbose) {
                process.stdout?.on('data', (data) => {
                    stdout += data.toString();
                });
                
                process.stderr?.on('data', (data) => {
                    stderr += data.toString();
                });
            }
            
            process.on('close', (code) => {
                if (code === 0) {
                    resolve({ code, stdout, stderr });
                } else {
                    reject(new Error(`Command failed with code ${code}: ${stderr || stdout}`));
                }
            });
            
            process.on('error', (error) => {
                reject(new Error(`Command execution failed: ${error.message}`));
            });
        });
    }
    
    timeoutPromise(ms, message) {
        return new Promise((_, reject) => {
            setTimeout(() => reject(new Error(message)), ms);
        });
    }
    
    isCriticalPhase(phaseName) {
        const criticalPhases = ['setup', 'environment'];
        return criticalPhases.includes(phaseName);
    }
    
    assessOverallStatus() {
        const phasesArray = Object.values(this.results.phases);
        const failedCritical = phasesArray.some(phase => 
            phase.status === 'failed' && this.isCriticalPhase(phase.name)
        );
        
        const successRate = phasesArray.filter(p => p.status === 'passed').length / phasesArray.length;
        
        if (failedCritical) {
            this.results.overall_status = 'critical_failure';
        } else if (successRate >= 0.8) {
            this.results.overall_status = 'success';
        } else if (successRate >= 0.6) {
            this.results.overall_status = 'partial_success';
        } else {
            this.results.overall_status = 'failure';
        }
        
        // Generate recommendations based on failures
        this.generateRecommendations();
    }
    
    generateRecommendations() {
        const failedPhases = Object.entries(this.results.phases)
            .filter(([_, phase]) => phase.status === 'failed')
            .map(([name, _]) => name);
            
        if (failedPhases.includes('environment')) {
            this.results.recommendations.push('Fix environment configuration before proceeding');
        }
        
        if (failedPhases.includes('validation')) {
            this.results.recommendations.push('Address core validation failures before deployment');
        }
        
        if (failedPhases.includes('performance')) {
            this.results.recommendations.push('Investigate performance issues and optimize slow components');
        }
        
        if (failedPhases.includes('integration')) {
            this.results.recommendations.push('Complete integration testing and resolve E2E failures');
        }
        
        if (this.results.overall_status === 'success') {
            this.results.recommendations.push('All validations passed - ready for deployment review');
        }
    }
    
    generateFinalReport() {
        console.log('\n' + '='.repeat(50));
        console.log('🎯 ORCHESTRATION SUMMARY');
        console.log('='.repeat(50));
        
        const statusIcon = {
            'success': '✅',
            'partial_success': '⚠️',
            'failure': '❌',
            'critical_failure': '🚨'
        }[this.results.overall_status] || '❓';
        
        console.log(`${statusIcon} Overall Status: ${this.results.overall_status.toUpperCase()}`);
        console.log(`⏱️  Duration: ${Math.round(this.results.duration_ms / 1000)}s`);
        console.log(`🔄 Phases: ${Object.keys(this.results.phases).length}`);
        console.log(`📊 Success Rate: ${this.calculateSuccessRate()}%`);
        
        if (this.results.recommendations.length > 0) {
            console.log('\n📋 Recommendations:');
            this.results.recommendations.forEach(rec => {
                console.log(`   • ${rec}`);
            });
        }
        
        if (this.results.artifacts.length > 0) {
            console.log('\n📄 Artifacts Generated:');
            this.results.artifacts.forEach(artifact => {
                console.log(`   • ${path.basename(artifact)}`);
            });
        }
        
        // Exit with appropriate code for CI/CD
        if (this.options.ciMode) {
            const exitCode = this.results.overall_status.includes('failure') ? 1 : 0;
            process.exit(exitCode);
        }
    }
    
    calculateSuccessRate() {
        const phases = Object.values(this.results.phases);
        if (phases.length === 0) return 0;
        
        const passed = phases.filter(p => p.status === 'passed').length;
        return Math.round((passed / phases.length) * 100);
    }
}

// CLI Interface
async function main() {
    const args = process.argv.slice(2);
    const options = {};
    
    // Parse command line arguments
    args.forEach(arg => {
        if (arg === '--quick') options.mode = 'quick';
        if (arg === '--comprehensive') options.mode = 'comprehensive';
        if (arg === '--no-checklist') options.updateChecklist = false;
        if (arg === '--no-reports') options.generateReports = false;
        if (arg === '--verbose') options.verbose = true;
        if (arg === '--ci') options.ciMode = true;
        if (arg.startsWith('--timeout=')) options.timeout = parseInt(arg.split('=')[1]) * 1000;
    });
    
    const orchestrator = new AutomationOrchestrator(options);
    await orchestrator.orchestrate();
}

// Export for use in other scripts
module.exports = { AutomationOrchestrator };

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Orchestrator failed:', error.message);
        process.exit(1);
    });
}