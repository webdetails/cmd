package pt.webdetails.cdf.mobile;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.util.HashMap;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;


import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.json.JSONException;

import org.pentaho.platform.engine.services.solution.BaseContentGenerator;
import org.pentaho.platform.api.engine.IParameterProvider;
import org.pentaho.platform.api.repository.ISolutionRepository;
import org.pentaho.platform.api.repository.IContentItem;
import org.pentaho.reporting.libraries.base.util.StringUtils;
import org.pentaho.platform.engine.core.system.PentahoSystem;
import pt.webdetails.cdf.mobile.favorites.FavoritesEngine;
import pt.webdetails.cdf.mobile.navigator.WcdfFileNavigator;

@SuppressWarnings("unchecked")
public class ContentGenerator extends BaseContentGenerator
{

  private static Log logger = LogFactory.getLog(ContentGenerator.class);
  public static final String PLUGIN_NAME = "cda";
  private static final long serialVersionUID = 1L;
  private static final String MIME_HTML = "text/xml";
  private static final String MIME_CSS = "text/css";
  private static final String MIME_JS = "text/javascript";
  private static final String MIME_JSON = "application/json";
  private static final String EDITOR_SOURCE = "/editor/editor.html";
  private static final String PREVIEWER_SOURCE = "/previewer/previewer.html";
  private static final String CACHEMAN_SOURCE = "/cachemanager/cache.html";
  private static final int DEFAULT_PAGE_SIZE = 20;
  private static final int DEFAULT_START_PAGE = 0;

  private enum Methods
  {

    FAVORITES, LISTDASHBOARDS
  }


  public ContentGenerator()
  {
  }


  @Override
  public void createContent()
  {
    HttpServletResponse response = null;
    final IParameterProvider pathParams;
    final IParameterProvider requestParams;
    final IContentItem contentItem;
    final OutputStream out;
    final String method;
    final String pathString;

    try
    {
      // If callbacks is properly setup, we assume we're being called from another plugin
      if (this.callbacks != null && callbacks.size() > 0 && HashMap.class.isInstance(callbacks.get(0)))
      {
        HashMap<String, Object> iface = (HashMap<String, Object>) callbacks.get(0);
        pathParams = parameterProviders.get("path");
        requestParams = parameterProviders.get("request");
        contentItem = outputHandler.getOutputContentItem("response", "content", "", instanceId, MIME_HTML);
        out = (OutputStream) iface.get("output");
        method = (String) iface.get("method");
      }
      else
      { // if not, we handle the request normally
        pathParams = parameterProviders.get("path");
        requestParams = parameterProviders.get("request");
        contentItem = outputHandler.getOutputContentItem("response", "content", "", instanceId, MIME_HTML);
        out = contentItem.getOutputStream(null);
        pathString = pathParams.getStringParameter("path", null);
        method = extractMethod(pathString);
        response = (HttpServletResponse) parameterProviders.get("path").getParameter("httpresponse"); //$NON-NLS-1$ //$NON-NLS-2$

        try
        {
          switch (Methods.valueOf(method.toUpperCase()))
          {
            case FAVORITES:
              processStorage(requestParams, out);
              break;
            case LISTDASHBOARDS:
              listDashboards(requestParams, out);
              break;
          }
        }
        catch (EnumConstantNotPresentException ex)
        {
          logger.error("Bad method name: " + method);
        }
      }

    }
    catch (Exception e)
    {
      Throwable except = e.getCause() != null ? e.getCause() : e;
      logger.error("Failed to execute: " + except.getMessage());
    }
  }


  private void setResponseHeaders(final String mimeType, final String attachmentName)
  {
    // Make sure we have the correct mime type
    final HttpServletResponse response = (HttpServletResponse) parameterProviders.get("path").getParameter("httpresponse");
    response.setHeader("Content-Type", mimeType);

    if (attachmentName != null)
    {
      response.setHeader("content-disposition", "attachment; filename=" + attachmentName);
    }

    // We can't cache this requests
    response.setHeader("Cache-Control", "max-age=0, no-store");
  }


  @Override
  public Log getLogger()
  {
    return logger;
  }


  public String getResourceAsString(final String path, final HashMap<String, String> tokens) throws IOException
  {
    // Read file
    String fullPath = PentahoSystem.getApplicationContext().getSolutionPath(path);
    ISolutionRepository solutionRepository = PentahoSystem.get(ISolutionRepository.class, userSession);
    final StringBuilder resource = new StringBuilder();
    if (solutionRepository.resourceExists(path))
    {
      final InputStream in = solutionRepository.getResourceInputStream(path, true, ISolutionRepository.ACTION_EXECUTE);
      int c;
      while ((c = in.read()) != -1)
      {
        resource.append((char) c);
      }
      in.close();
    }
    else
    {
      resource.append(" ");
    }
    // Make replacement of tokens
    if (tokens != null)
    {

      for (final String key : tokens.keySet())
      {
        final int index = resource.indexOf(key);
        if (index != -1)
        {
          resource.replace(index, index + key.length(), tokens.get(key));
        }
      }

    }


    final String output = resource.toString();

    return output;

  }


  public void getresource(final IParameterProvider pathParams, final OutputStream out) throws Exception
  {

    String resource = pathParams.getStringParameter("resource", null);
    resource = resource.startsWith("/") ? resource : "/" + resource;
    getResource(out, resource);

  }


  private void getResource(final OutputStream out, final String resource) throws IOException
  {


    final String path = PentahoSystem.getApplicationContext().getSolutionPath("system/" + PLUGIN_NAME + resource); //$NON-NLS-1$ //$NON-NLS-2$

    final File file = new File(path);
    final InputStream in = new FileInputStream(file);
    final byte[] buff = new byte[4096];


    int n = in.read(buff);


    while (n != -1)
    {
      out.write(buff, 0, n);
      n = in.read(buff);


    }
    in.close();


  }


  private String extractMethod(final String pathString)
  {
    if (StringUtils.isEmpty(pathString))
    {
      return null;
    }
    final String pathWithoutSlash = pathString.substring(1);
    if (pathWithoutSlash.indexOf('/') > -1)
    {
      return null;
    }
    final int queryStart = pathWithoutSlash.indexOf('?');
    if (queryStart < 0)
    {
      return pathWithoutSlash;
    }
    return pathWithoutSlash.substring(0, queryStart);
  }


  private void processStorage(final IParameterProvider requestParams, final OutputStream out) throws JSONException
  {

    String result;


    final FavoritesEngine storagesEngine = FavoritesEngine.getInstance();
    result = storagesEngine.process(requestParams, userSession);


    final PrintWriter pw = new PrintWriter(out);
    pw.println(result);
    pw.flush();

  }


  private void listDashboards(IParameterProvider requestParams, OutputStream out)
  {

    final HttpServletResponse response = (HttpServletResponse) parameterProviders.get("path").getParameter("httpresponse");
    response.setHeader("Content-Type", "application/json");

    final String contextPath = ((HttpServletRequest) parameterProviders.get("path").getParameter("httprequest")).getContextPath();
    final WcdfFileNavigator nav = new WcdfFileNavigator(userSession, contextPath);
    try
    {
      final String json = nav.getWcdfFilelist("navigator", "Eco", "");
      out.write(json.getBytes("UTF8"));
    }
    catch (Exception e)
    {
      logger.error(e);
    }
  }
}
