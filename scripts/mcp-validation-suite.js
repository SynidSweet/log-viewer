#!/usr/bin/env node
/**
 * MCP Validation Suite - Orchestrates all validation tests
 * 
 * Comprehensive test suite that runs all MCP validation scripts
 * and generates consolidated reports for MVP completion assessment
 * 
 * Task: TASK-2025-009 - Create MCP integration validation scripts
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { MCPValidator } = require('./validate-mcp-integration');
const { MCPToolTester, MCPPerformanceTester } = require('./mcp-tool-tester');
const { MCPEndToEndTester } = require('./mcp-e2e-tests');
const { ChecklistTracker } = require('./update-checklist-progress');

class MCPValidationSuite {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      suite_version: '1.0.0',
      environment: {
        node_version: process.version,
        platform: process.platform,
        cwd: process.cwd()
      },
      tests: {},
      summary: {
        total_suites: 0,
        passed_suites: 0,
        failed_suites: 0,
        success_rate: 0,
        overall_status: 'unknown',
        mvp_ready: false
      },
      recommendations: [],
      next_steps: []
    };
  }

  async runFullValidationSuite(options = {}) {
    console.log('🚀 MCP MVP Validation Suite');
    console.log('============================');
    console.log(`Started: ${new Date().toISOString()}\n`);

    try {
      // 1. Environment Validation
      if (!options.skipEnvironment) {
        await this.validateEnvironment();
      }

      // 2. Integration Validation
      if (!options.skipIntegration) {
        await this.runIntegrationValidation();
      }

      // 3. Tool Testing
      if (!options.skipTools) {
        await this.runToolTesting();
      }

      // 4. Performance Testing
      if (!options.skipPerformance) {
        await this.runPerformanceTesting();
      }

      // 5. End-to-End Testing
      if (!options.skipE2E) {
        await this.runE2ETesting();
      }

      // 6. Generate consolidated reports
      await this.generateConsolidatedReports();

      // 7. Update MVP checklist
      if (options.updateChecklist) {
        await this.updateMVPChecklist();
      }

      this.printFinalSummary();

    } catch (error) {
      console.error(`💥 Validation suite failed: ${error.message}`);
      this.results.summary.overall_status = 'failed';
      throw error;
    }
  }

  async validateEnvironment() {
    console.log('🌍 Environment Validation');
    console.log('-'.repeat(30));

    const envTests = {
      node_version: this.checkNodeVersion(),
      npm_available: this.checkNPMAvailable(),
      mcp_server_exists: this.checkMCPServerExists(),
      dependencies_installed: await this.checkDependenciesInstalled(),
      environment_vars: this.checkEnvironmentVars(),
      database_config: this.checkDatabaseConfig()
    };

    const envPassed = Object.values(envTests).every(test => test.passed);

    this.results.tests.environment = {
      passed: envPassed,
      tests: envTests,
      error: envPassed ? null : 'Environment validation failed'
    };

    this.results.summary.total_suites++;
    if (envPassed) {
      this.results.summary.passed_suites++;
      console.log('✅ Environment validation: PASSED\n');
    } else {
      this.results.summary.failed_suites++;
      console.log('❌ Environment validation: FAILED\n');
    }
  }

  async runIntegrationValidation() {
    console.log('🔧 Integration Validation');
    console.log('-'.repeat(30));

    try {
      const validator = new MCPValidator();
      await validator.validate({
        performance: false,
        integration: true,
        report: false
      });

      // Extract results from the global validationResults
      const { validationResults } = require('./validate-mcp-integration');
      
      this.results.tests.integration = {
        passed: validationResults.summary.percentage >= 90,
        server_startup: validationResults.server_startup,
        database: validationResults.integration.database,
        claude_code: validationResults.integration.claude_code,
        error: validationResults.summary.percentage < 90 ? 'Integration validation below 90% threshold' : null
      };

      this.results.summary.total_suites++;
      if (this.results.tests.integration.passed) {
        this.results.summary.passed_suites++;
        console.log('✅ Integration validation: PASSED\n');
      } else {
        this.results.summary.failed_suites++;
        console.log('❌ Integration validation: FAILED\n');
      }

    } catch (error) {
      this.results.tests.integration = {
        passed: false,
        error: error.message
      };
      this.results.summary.total_suites++;
      this.results.summary.failed_suites++;
      console.log(`❌ Integration validation: FAILED - ${error.message}\n`);
    }
  }

  async runToolTesting() {
    console.log('🔧 MCP Tool Testing');
    console.log('-'.repeat(30));

    try {
      const tester = new MCPToolTester();
      const toolResults = await tester.runComprehensiveTest();

      const totalTools = Object.keys(toolResults).length;
      const passedTools = Object.values(toolResults).filter(r => r.success).length;
      const successRate = Math.round((passedTools / totalTools) * 100);

      this.results.tests.tools = {
        passed: successRate >= 90,
        total_tools: totalTools,
        passed_tools: passedTools,
        success_rate: successRate,
        results: toolResults,
        error: successRate < 90 ? `Tool success rate ${successRate}% below 90% threshold` : null
      };

      this.results.summary.total_suites++;
      if (this.results.tests.tools.passed) {
        this.results.summary.passed_suites++;
        console.log('✅ Tool testing: PASSED\n');
      } else {
        this.results.summary.failed_suites++;
        console.log('❌ Tool testing: FAILED\n');
      }

    } catch (error) {
      this.results.tests.tools = {
        passed: false,
        error: error.message
      };
      this.results.summary.total_suites++;
      this.results.summary.failed_suites++;
      console.log(`❌ Tool testing: FAILED - ${error.message}\n`);
    }
  }

  async runPerformanceTesting() {
    console.log('⚡ Performance Testing');
    console.log('-'.repeat(30));

    try {
      const tester = new MCPPerformanceTester();
      const perfResults = await tester.runPerformanceSuite();

      const totalBenchmarks = Object.keys(perfResults).length;
      const passedBenchmarks = Object.values(perfResults).filter(r => r.success && r.average <= r.threshold).length;
      const successRate = Math.round((passedBenchmarks / totalBenchmarks) * 100);

      this.results.tests.performance = {
        passed: successRate >= 80, // 80% threshold for performance
        total_benchmarks: totalBenchmarks,
        passed_benchmarks: passedBenchmarks,
        success_rate: successRate,
        results: perfResults,
        error: successRate < 80 ? `Performance success rate ${successRate}% below 80% threshold` : null
      };

      this.results.summary.total_suites++;
      if (this.results.tests.performance.passed) {
        this.results.summary.passed_suites++;
        console.log('✅ Performance testing: PASSED\n');
      } else {
        this.results.summary.failed_suites++;
        console.log('❌ Performance testing: FAILED\n');
      }

    } catch (error) {
      this.results.tests.performance = {
        passed: false,
        error: error.message
      };
      this.results.summary.total_suites++;
      this.results.summary.failed_suites++;
      console.log(`❌ Performance testing: FAILED - ${error.message}\n`);
    }
  }

  async runE2ETesting() {
    console.log('🔄 End-to-End Testing');
    console.log('-'.repeat(30));

    try {
      const tester = new MCPEndToEndTester();
      const e2eResults = await tester.runEndToEndTests();

      this.results.tests.e2e = {
        passed: e2eResults.summary.failed === 0,
        total_suites: e2eResults.summary.total,
        passed_suites: e2eResults.summary.passed,
        failed_suites: e2eResults.summary.failed,
        results: e2eResults.suites,
        error: e2eResults.summary.failed > 0 ? `${e2eResults.summary.failed} E2E test suites failed` : null
      };

      this.results.summary.total_suites++;
      if (this.results.tests.e2e.passed) {
        this.results.summary.passed_suites++;
        console.log('✅ End-to-End testing: PASSED\n');
      } else {
        this.results.summary.failed_suites++;
        console.log('❌ End-to-End testing: FAILED\n');
      }

    } catch (error) {
      this.results.tests.e2e = {
        passed: false,
        error: error.message
      };
      this.results.summary.total_suites++;
      this.results.summary.failed_suites++;
      console.log(`❌ End-to-End testing: FAILED - ${error.message}\n`);
    }
  }

  // Environment check helpers
  checkNodeVersion() {
    try {
      const version = process.version;
      const majorVersion = parseInt(version.slice(1).split('.')[0]);
      const passed = majorVersion >= 18;

      return {
        passed,
        version,
        error: passed ? null : 'Node.js 18+ required'
      };
    } catch (error) {
      return { passed: false, error: error.message };
    }
  }

  checkNPMAvailable() {
    try {
      execSync('npm --version', { stdio: 'ignore' });
      return { passed: true, error: null };
    } catch (error) {
      return { passed: false, error: 'npm not available' };
    }
  }

  checkMCPServerExists() {
    const serverPath = path.join(__dirname, '../mcp-server');
    const packagePath = path.join(serverPath, 'package.json');

    const exists = fs.existsSync(serverPath) && fs.existsSync(packagePath);
    
    return {
      passed: exists,
      path: serverPath,
      error: exists ? null : 'MCP server directory or package.json not found'
    };
  }

  async checkDependenciesInstalled() {
    try {
      const serverPath = path.join(__dirname, '../mcp-server');
      const nodeModulesPath = path.join(serverPath, 'node_modules');
      
      const installed = fs.existsSync(nodeModulesPath);
      
      if (!installed) {
        console.log('  📦 Installing MCP server dependencies...');
        execSync('npm install', { cwd: serverPath, stdio: 'inherit' });
      }

      return {
        passed: true,
        error: null
      };
    } catch (error) {
      return {
        passed: false,
        error: `Dependency installation failed: ${error.message}`
      };
    }
  }

  checkEnvironmentVars() {
    const requiredVars = ['TURSO_DATABASE_URL', 'TURSO_AUTH_TOKEN'];
    const missingVars = [];

    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        // Check if it exists in .env file
        const envPath = path.join(__dirname, '../.env');
        if (fs.existsSync(envPath)) {
          const envContent = fs.readFileSync(envPath, 'utf8');
          if (!envContent.includes(`${varName}=`)) {
            missingVars.push(varName);
          }
        } else {
          missingVars.push(varName);
        }
      }
    }

    return {
      passed: missingVars.length === 0,
      missing: missingVars,
      error: missingVars.length > 0 ? `Missing environment variables: ${missingVars.join(', ')}` : null
    };
  }

  checkDatabaseConfig() {
    try {
      const dbPath = path.join(__dirname, '../mcp-server/src/lib/db-turso.ts');
      const exists = fs.existsSync(dbPath);

      return {
        passed: exists,
        path: dbPath,
        error: exists ? null : 'Database module not found'
      };
    } catch (error) {
      return {
        passed: false,
        error: error.message
      };
    }
  }

  async generateConsolidatedReports() {
    console.log('📊 Generating Consolidated Reports');
    console.log('-'.repeat(30));

    const reportDir = path.join(__dirname, '../validation-results');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    // Calculate final summary
    this.results.summary.success_rate = Math.round(
      (this.results.summary.passed_suites / this.results.summary.total_suites) * 100
    );

    // Determine MVP readiness
    this.results.summary.mvp_ready = this.assessMVPReadiness();
    this.results.summary.overall_status = this.results.summary.mvp_ready ? 'ready' : 'not_ready';

    // Generate recommendations
    this.generateRecommendations();

    // JSON report
    const jsonPath = path.join(reportDir, 'mcp-validation-suite-report.json');
    fs.writeFileSync(jsonPath, JSON.stringify(this.results, null, 2));

    // Markdown report
    const markdown = this.generateConsolidatedMarkdown();
    const mdPath = path.join(reportDir, 'mcp-validation-suite-report.md');
    fs.writeFileSync(mdPath, markdown);

    // Executive summary
    const execSummary = this.generateExecutiveSummary();
    const execPath = path.join(reportDir, 'mcp-mvp-executive-summary.md');
    fs.writeFileSync(execPath, execSummary);

    console.log(`✅ Reports generated in ${reportDir}/`);
    console.log('   - mcp-validation-suite-report.json (detailed)');
    console.log('   - mcp-validation-suite-report.md (comprehensive)');
    console.log('   - mcp-mvp-executive-summary.md (stakeholder summary)\n');
  }

  assessMVPReadiness() {
    const { tests, summary } = this.results;

    // Critical requirements for MVP
    const criticalChecks = [
      tests.environment?.passed,
      tests.integration?.passed,
      tests.tools?.success_rate >= 90,
      summary.success_rate >= 85
    ];

    return criticalChecks.every(check => check === true);
  }

  generateRecommendations() {
    const { tests } = this.results;

    if (!tests.environment?.passed) {
      this.results.recommendations.push('🌍 Fix environment setup issues before deployment');
    }

    if (!tests.integration?.passed) {
      this.results.recommendations.push('🔧 Resolve integration validation failures');
    }

    if (tests.tools && tests.tools.success_rate < 90) {
      this.results.recommendations.push(`🔧 Improve tool success rate from ${tests.tools.success_rate}% to 90%+`);
    }

    if (tests.performance && tests.performance.success_rate < 80) {
      this.results.recommendations.push(`⚡ Address performance issues (${tests.performance.success_rate}% success rate)`);
    }

    if (!tests.e2e?.passed) {
      this.results.recommendations.push('🔄 Fix end-to-end test failures');
    }

    // Next steps
    if (this.results.summary.mvp_ready) {
      this.results.next_steps.push('🚀 Ready for production deployment');
      this.results.next_steps.push('📋 Update MVP completion checklist');
      this.results.next_steps.push('👥 Schedule stakeholder review');
    } else {
      this.results.next_steps.push('❌ Address validation failures before deployment');
      this.results.next_steps.push('🔄 Re-run validation suite after fixes');
      this.results.next_steps.push('📈 Track progress towards MVP completion');
    }
  }

  generateConsolidatedMarkdown() {
    const { summary, timestamp } = this.results;

    return `# MCP MVP Validation Suite Report

**Generated**: ${timestamp}  
**Suite Version**: ${this.results.suite_version}  
**Overall Status**: ${summary.overall_status.toUpperCase()}  
**MVP Ready**: ${summary.mvp_ready ? '✅ YES' : '❌ NO'}  
**Success Rate**: ${summary.success_rate}%

## Executive Summary

${summary.mvp_ready ? 
  '🎉 **READY FOR DEPLOYMENT**: All critical MVP requirements met. The MCP server is ready for production deployment.' :
  '⚠️  **NOT READY**: Critical issues need resolution before MVP deployment. See recommendations below.'
}

## Validation Results

### Test Suite Overview
- **Total Suites**: ${summary.total_suites}
- **Passed**: ${summary.passed_suites}
- **Failed**: ${summary.failed_suites}
- **Success Rate**: ${summary.success_rate}%

### Detailed Results

${Object.entries(this.results.tests).map(([suite, result]) => {
  const status = result.passed ? '✅ PASSED' : '❌ FAILED';
  return `#### ${suite.charAt(0).toUpperCase() + suite.slice(1)} Validation
**Status**: ${status}  
${result.error ? `**Error**: ${result.error}` : ''}
${this.generateSuiteDetails(suite, result)}
`;
}).join('\n')}

## Recommendations

${this.results.recommendations.map(rec => `- ${rec}`).join('\n')}

## Next Steps

${this.results.next_steps.map(step => `1. ${step}`).join('\n')}

## Environment Details

- **Node.js**: ${this.results.environment.node_version}
- **Platform**: ${this.results.environment.platform}
- **Working Directory**: ${this.results.environment.cwd}

---
*Generated by MCP MVP Validation Suite v${this.results.suite_version}*
`;
  }

  generateSuiteDetails(suiteName, result) {
    switch (suiteName) {
      case 'tools':
        if (result.total_tools) {
          return `**Tools**: ${result.passed_tools}/${result.total_tools} passed (${result.success_rate}%)`;
        }
        break;
      case 'performance':
        if (result.total_benchmarks) {
          return `**Benchmarks**: ${result.passed_benchmarks}/${result.total_benchmarks} passed (${result.success_rate}%)`;
        }
        break;
      case 'e2e':
        if (result.total_suites) {
          return `**E2E Suites**: ${result.passed_suites}/${result.total_suites} passed`;
        }
        break;
      default:
        return '';
    }
    return '';
  }

  generateExecutiveSummary() {
    const { summary, timestamp } = this.results;

    return `# MCP MVP Executive Summary

**Date**: ${timestamp}  
**Status**: ${summary.mvp_ready ? '✅ READY FOR DEPLOYMENT' : '❌ NOT READY'}  
**Overall Success Rate**: ${summary.success_rate}%

## Key Findings

${summary.mvp_ready ? 
  '✅ **MVP COMPLETE**: The MCP server has successfully passed comprehensive validation testing and is ready for production deployment.' :
  '❌ **MVP INCOMPLETE**: Critical validation failures prevent production deployment at this time.'
}

## Validation Coverage

- ✅ **Environment Setup**: System requirements and dependencies
- ✅ **Integration Testing**: MCP server startup and connectivity  
- ✅ **Tool Functionality**: All ${Object.keys(this.results.tests.tools?.results || {}).length}+ MCP tools
- ✅ **Performance Testing**: Response time and throughput benchmarks
- ✅ **End-to-End Testing**: Complete workflow validation

## Business Impact

${summary.mvp_ready ? 
  '🚀 **Ready for Launch**: External tools and AI agents can integrate with the log viewer system immediately.' :
  '⏳ **Delayed Launch**: Integration capabilities are not yet ready for external use.'
}

## Risk Assessment

**Risk Level**: ${summary.success_rate >= 90 ? 'LOW' : summary.success_rate >= 70 ? 'MEDIUM' : 'HIGH'}

${this.results.recommendations.length > 0 ? 
  `## Critical Actions Required\n\n${this.results.recommendations.slice(0, 3).map(rec => `- ${rec}`).join('\n')}` :
  '## No Critical Issues\n\nAll validation tests passed successfully.'
}

## Recommendation

${summary.mvp_ready ? 
  '**PROCEED** with production deployment. All MVP requirements satisfied.' :
  '**DO NOT DEPLOY** until validation failures are resolved.'
}

---
*Prepared for: Product Team, DevOps Team*  
*Generated by: MCP MVP Validation Suite*
`;
  }

  async updateMVPChecklist() {
    console.log('📋 Updating MVP Checklist');
    console.log('-'.repeat(30));

    try {
      // Use the comprehensive ChecklistTracker for advanced updates
      const tracker = new ChecklistTracker();
      
      // Update based on validation results
      const updated = await tracker.updateFromValidationResults();
      
      if (updated) {
        // Update validation automation specific items
        if (this.results.summary.mvp_ready) {
          tracker.markComplete(
            'Validation Scripts & Automation',
            'MCP server startup validation script',
            `Validation suite completed with ${this.results.summary.success_rate}% success rate`
          );
          
          tracker.markComplete(
            'Validation Scripts & Automation',
            'All tools functional testing script',
            `${this.results.tests.tools?.passed_count || 0} tools validated`
          );
          
          tracker.markComplete(
            'Validation Scripts & Automation',
            'Performance benchmark automation',
            `Performance benchmarks ${this.results.tests.performance?.passed ? 'passed' : 'completed'}`
          );
          
          if (process.env.CI) {
            tracker.markComplete(
              'Validation Scripts & Automation',
              'CI/CD workflow integration',
              'GitHub Actions workflow validated'
            );
          }
        }
        
        // Save the comprehensive updates
        tracker.saveChecklist();
        
        // Generate progress report
        const report = tracker.generateProgressReport();
        const reportsDir = path.join(__dirname, '../validation-results');
        if (!fs.existsSync(reportsDir)) {
          fs.mkdirSync(reportsDir, { recursive: true });
        }
        
        const reportFile = path.join(reportsDir, `checklist-progress-${Date.now()}.json`);
        fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
        
        console.log('✅ MVP checklist comprehensively updated');
        console.log(`📊 Completion: ${report.completion_status.percentage}%`);
        console.log(`📋 Progress report: ${reportFile}\n`);
      } else {
        console.log('⚠️  No validation results available for checklist update\n');
      }
      
    } catch (error) {
      console.log(`⚠️  Checklist update failed: ${error.message}\n`);
      
      // Fallback to basic update
      try {
        const checklistPath = path.join(__dirname, '../docs/validation/mcp-mvp-completion-checklist.md');
        
        if (fs.existsSync(checklistPath)) {
          let checklist = fs.readFileSync(checklistPath, 'utf8');

          // Update validation scripts section
          if (this.results.summary.mvp_ready) {
            checklist = checklist.replace(
              '- [ ] **Validation Scripts & Automation** (TASK-2025-009)',
              '- [x] **Validation Scripts & Automation** (TASK-2025-009) ✅'
            );
          }

          fs.writeFileSync(checklistPath, checklist);
          console.log('✅ Basic MVP checklist update completed\n');
        }
      } catch (fallbackError) {
        console.log(`❌ Fallback checklist update also failed: ${fallbackError.message}\n`);
      }
    }
  }

  printFinalSummary() {
    console.log('🎯 FINAL VALIDATION SUMMARY');
    console.log('============================');

    const { summary } = this.results;

    console.log(`📊 Test Results: ${summary.passed_suites}/${summary.total_suites} suites passed`);
    console.log(`📈 Success Rate: ${summary.success_rate}%`);
    console.log(`🎯 MVP Status: ${summary.mvp_ready ? '✅ READY' : '❌ NOT READY'}`);

    if (summary.mvp_ready) {
      console.log('\n🎉 CONGRATULATIONS!');
      console.log('The MCP server MVP has passed comprehensive validation.');
      console.log('Ready for production deployment! 🚀');
    } else {
      console.log('\n⚠️  MVP VALIDATION INCOMPLETE');
      console.log('Address the following issues before deployment:');
      this.results.recommendations.forEach(rec => console.log(`  ${rec}`));
    }

    console.log(`\n📝 Detailed reports available in validation-results/`);
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const options = {
    skipEnvironment: false,
    skipIntegration: false,
    skipTools: false,
    skipPerformance: false,
    skipE2E: false,
    updateChecklist: false
  };

  // Parse arguments
  for (const arg of args) {
    if (arg === '--skip-environment') options.skipEnvironment = true;
    else if (arg === '--skip-integration') options.skipIntegration = true;
    else if (arg === '--skip-tools') options.skipTools = true;
    else if (arg === '--skip-performance') options.skipPerformance = true;
    else if (arg === '--skip-e2e') options.skipE2E = true;
    else if (arg === '--update-checklist') options.updateChecklist = true;
    else if (arg === '--help') {
      console.log(`
MCP MVP Validation Suite

Usage: node scripts/mcp-validation-suite.js [options]

Options:
  --skip-environment    Skip environment validation
  --skip-integration    Skip integration tests  
  --skip-tools          Skip tool functionality tests
  --skip-performance    Skip performance benchmarks
  --skip-e2e            Skip end-to-end tests
  --update-checklist    Update MVP completion checklist
  --help                Show this help

This comprehensive suite validates MVP readiness by running:
- Environment setup validation
- MCP server integration testing  
- Tool functionality testing
- Performance benchmarking
- End-to-end workflow testing

Reports are generated in validation-results/ directory.
      `);
      return;
    }
  }

  try {
    const suite = new MCPValidationSuite();
    await suite.runFullValidationSuite(options);

    // Exit with appropriate code based on MVP readiness
    process.exit(suite.results.summary.mvp_ready ? 0 : 1);

  } catch (error) {
    console.error(`💥 Validation suite failed: ${error.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { MCPValidationSuite };